import { requireEmployee } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { serializeTransaction, transactionInclude } from '@/lib/server/pos';
import { handleApiError, ok } from '@/lib/server/responses';

export async function GET() {
  try {
    const employee = await requireEmployee();
    const [quickButtons, transactions, settings] = await Promise.all([
      prisma.quickSaleButton.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: transactionInclude,
      }),
      prisma.shopSetting.findMany({
        where: { key: { in: ['taxRateBasisPoints', 'receiptPrefix', 'warrantyLanguage'] } },
      }),
    ]);

    return ok({
      employee,
      quickButtons: quickButtons.map((button) => ({
        id: button.id,
        label: button.label,
        quantity: button.quantity,
        unitCents: button.unitCents,
        type: normalizeLineType(button.lineType),
      })),
      transactions: transactions.map(serializeTransaction),
      settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function normalizeLineType(value: string): 'tire' | 'service' | 'fee' | 'discount' {
  if (value === 'tire' || value === 'service' || value === 'fee' || value === 'discount') return value;
  return 'service';
}
