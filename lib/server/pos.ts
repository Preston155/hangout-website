import type { Prisma } from '@prisma/client';
import { toUiPaymentMethod, toUiStatus } from '@/lib/pos/mappers';

export const transactionInclude = {
  employee: { select: { name: true } },
  customer: { select: { name: true, phone: true } },
  vehicle: { select: { year: true, make: true, model: true, mileage: true, licensePlate: true } },
  lines: { orderBy: { createdAt: 'asc' as const } },
  printJobs: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

export type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export function serializeTransaction(transaction: TransactionWithDetails) {
  const lastPrint = transaction.printJobs[0];
  const printed = lastPrint?.status === 'PRINTED';
  const failedPrint = lastPrint?.status === 'FAILED' || lastPrint?.status === 'RETRY_AVAILABLE';
  const vehicleText = [
    transaction.vehicle?.year,
    transaction.vehicle?.make,
    transaction.vehicle?.model,
  ]
    .filter(Boolean)
    .join(' ');

  const tireLine = transaction.lines.find((line) => line.lineType === 'tire');

  return {
    id: transaction.id,
    receiptNumber: transaction.receiptNumber,
    customer: transaction.customer?.name || 'Walk-in Customer',
    phone: transaction.customer?.phone || '',
    tireSize: tireLine?.label.match(/\d{3}\/\d{2}R\d{2}/)?.[0] ?? '',
    vehicle: vehicleText,
    employee: transaction.employee.name,
    paymentMethod: toUiPaymentMethod(transaction.paymentMethod),
    totalCents: transaction.totalCents,
    status: toUiStatus(transaction.status, printed, failedPrint),
    createdAt: transaction.createdAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    lines: transaction.lines.map((line) => ({
      id: line.id,
      label: line.label,
      quantity: line.quantity,
      unitCents: line.unitCents,
      type: normalizeLineType(line.lineType),
    })),
  };
}

function normalizeLineType(value: string): 'tire' | 'service' | 'fee' | 'discount' {
  if (value === 'tire' || value === 'service' || value === 'fee' || value === 'discount') return value;
  return 'service';
}
