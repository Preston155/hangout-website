import { requireEmployee } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { serializeTransaction, transactionInclude } from '@/lib/server/pos';
import { handleApiError, ok } from '@/lib/server/responses';

export async function GET(request: Request) {
  try {
    await requireEmployee();
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim();
    const transactions = await prisma.transaction.findMany({
      where: query
        ? {
            OR: [
              { receiptNumber: { contains: query, mode: 'insensitive' } },
              { customer: { name: { contains: query, mode: 'insensitive' } } },
              { customer: { phone: { contains: query, mode: 'insensitive' } } },
              { lines: { some: { label: { contains: query, mode: 'insensitive' } } } },
              { vehicle: { make: { contains: query, mode: 'insensitive' } } },
              { vehicle: { model: { contains: query, mode: 'insensitive' } } },
              { vehicle: { licensePlate: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: transactionInclude,
    });
    return ok({ transactions: transactions.map(serializeTransaction) });
  } catch (error) {
    return handleApiError(error);
  }
}
