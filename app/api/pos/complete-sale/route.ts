import { z } from 'zod';
import { calculateSaleTotals } from '@/lib/pos/money';
import { toDbPaymentMethod, toDbTireCondition } from '@/lib/pos/mappers';
import { formatReceiptNumber } from '@/lib/pos/receipt-number';
import { completeSaleSchema } from '@/lib/pos/validation';
import { requireEmployee } from '@/lib/server/auth';
import { createPrinterAdapter } from '@/lib/server/printer';
import { prisma } from '@/lib/server/prisma';
import { serializeTransaction, transactionInclude } from '@/lib/server/pos';
import { handleApiError, ok } from '@/lib/server/responses';

export async function POST(request: Request) {
  try {
    const employee = await requireEmployee();
    const payload = completeSaleSchema.parse(await request.json());
    const totals = calculateSaleTotals({
      lines: payload.lines,
      discountCents: payload.discountCents,
      taxRateBasisPoints: payload.taxRateBasisPoints,
      amountReceivedCents: payload.paymentMethod === 'Cash' ? payload.amountReceivedCents : undefined,
    });

    if (payload.paymentMethod === 'Cash' && totals.changeDueCents < 0) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['amountReceivedCents'],
          message: 'Cash received is below the transaction total.',
        },
      ]);
    }

    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
      include: transactionInclude,
    });
    if (existing) {
      return ok({ transaction: serializeTransaction(existing), idempotent: true });
    }

    const year = new Date().getFullYear();
    const receiptPrefix = await getStringSetting('receiptPrefix', 'ATS');
    const printer = createPrinterAdapter();
    const saved = await prisma.$transaction(async (tx) => {
      const counter = await tx.receiptCounter.upsert({
        where: { year },
        create: { year, nextSequence: 2 },
        update: { nextSequence: { increment: 1 } },
      });
      const sequence = counter.nextSequence - 1;
      const receiptNumber = formatReceiptNumber(receiptPrefix, year, sequence);
      const customer =
        payload.customer?.name || payload.customer?.phone || payload.customer?.email
          ? await tx.customer.create({
              data: {
                name: payload.customer?.name || null,
                phone: payload.customer?.phone || null,
                email: payload.customer?.email || null,
              },
            })
          : null;
      const vehicle =
        payload.vehicle && Object.values(payload.vehicle).some(Boolean)
          ? await tx.vehicle.create({
              data: {
                customerId: customer?.id,
                year: payload.vehicle.year || null,
                make: payload.vehicle.make || null,
                model: payload.vehicle.model || null,
                mileage: payload.vehicle.mileage ? Number.parseInt(payload.vehicle.mileage, 10) || null : null,
                licensePlate: payload.vehicle.licensePlate || null,
              },
            })
          : null;

      const transaction = await tx.transaction.create({
        data: {
          receiptNumber,
          receiptYear: year,
          receiptSequence: sequence,
          idempotencyKey: payload.idempotencyKey,
          employeeId: employee.id,
          customerId: customer?.id,
          vehicleId: vehicle?.id,
          paymentMethod: toDbPaymentMethod(payload.paymentMethod),
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxRateBasisPoints: payload.taxRateBasisPoints,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          amountReceivedCents: totals.amountReceivedCents,
          changeDueCents: totals.changeDueCents,
          notes: payload.notes || null,
          warrantyNotes: payload.warrantyNotes || null,
          lines: {
            create: payload.lines.map((line) => ({
              label: line.type === 'tire' ? `${payload.tireSize} ${payload.condition} ${line.label}` : line.label,
              lineType: line.type,
              quantity: line.quantity,
              unitCents: line.unitCents,
              totalCents: line.quantity * line.unitCents,
            })),
          },
          printJobs: {
            create: {
              status: 'PENDING',
              printerMode: printer.mode,
            },
          },
          auditLogs: {
            create: {
              actingEmployeeId: employee.id,
              action: 'COMPLETED_SALE',
              entityType: 'Transaction',
              afterValue: {
                receiptNumber,
                totalCents: totals.totalCents,
                paymentMethod: payload.paymentMethod,
                condition: toDbTireCondition(payload.condition),
              },
            },
          },
        },
        include: transactionInclude,
      });
      return transaction;
    });

    const printJob = saved.printJobs[0];
    if (printJob) {
      try {
        await prisma.printJob.update({ where: { id: printJob.id }, data: { status: 'PRINTING', attempts: { increment: 1 } } });
        await printer.printReceipt({
          receiptNumber: saved.receiptNumber,
          receiptText: buildPlainReceipt(saved.receiptNumber, payload.lines, totals.totalCents, payload.paymentMethod),
          qrUrl: '',
          openDrawer: false,
          cutPaper: true,
        });
        await prisma.printJob.update({ where: { id: printJob.id }, data: { status: 'PRINTED', printedAt: new Date() } });
        await prisma.auditLog.create({
          data: { actingEmployeeId: employee.id, action: 'SUCCESSFUL_PRINT', entityType: 'PrintJob', entityId: printJob.id, transactionId: saved.id },
        });
      } catch (error) {
        await prisma.printJob.update({
          where: { id: printJob.id },
          data: { status: 'RETRY_AVAILABLE', lastError: error instanceof Error ? error.message : 'Print failed.' },
        });
        await prisma.auditLog.create({
          data: {
            actingEmployeeId: employee.id,
            action: 'FAILED_PRINT',
            entityType: 'PrintJob',
            entityId: printJob.id,
            transactionId: saved.id,
            reason: error instanceof Error ? error.message : 'Print failed.',
          },
        });
      }
    }

    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: saved.id },
      include: transactionInclude,
    });

    return ok({ transaction: serializeTransaction(transaction), idempotent: false });
  } catch (error) {
    return handleApiError(error);
  }
}

async function getStringSetting(key: string, fallback: string) {
  const setting = await prisma.shopSetting.findUnique({ where: { key } });
  return typeof setting?.value === 'string' ? setting.value : fallback;
}

function buildPlainReceipt(receiptNumber: string, lines: { label: string; quantity: number; unitCents: number }[], totalCents: number, paymentMethod: string) {
  const body = lines.map((line) => `${line.quantity}x ${line.label} ${(line.quantity * line.unitCents / 100).toFixed(2)}`).join('\n');
  return `AKRON TIRE SHOP\n${receiptNumber}\n${body}\nTOTAL ${(totalCents / 100).toFixed(2)}\nPAYMENT ${paymentMethod}`;
}
