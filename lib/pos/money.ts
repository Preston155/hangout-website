export type SaleCalculationLine = {
  quantity: number;
  unitCents: number;
};

export type SaleCalculationInput = {
  lines: SaleCalculationLine[];
  discountCents?: number;
  taxRateBasisPoints: number;
  amountReceivedCents?: number;
};

export type SaleTotals = {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
  amountReceivedCents: number | null;
  changeDueCents: number;
};

export function cents(value: number | string): number {
  const normalized = typeof value === 'string' ? value.trim().replace(/[$,]/g, '') : value;
  if (normalized === '') return 0;
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue)) {
    throw new Error('Invalid money value');
  }
  return Math.round(numberValue * 100);
}

export function formatMoney(valueCents: number): string {
  const sign = valueCents < 0 ? '-' : '';
  const absolute = Math.abs(valueCents);
  return `${sign}$${(absolute / 100).toFixed(2)}`;
}

export function calculateSaleTotals(input: SaleCalculationInput): SaleTotals {
  const subtotalCents = input.lines.reduce((sum, line) => {
    assertIntegerCents(line.unitCents, 'unitCents');
    if (!Number.isInteger(line.quantity) || line.quantity < 0) {
      throw new Error('Quantity must be a non-negative integer');
    }
    return sum + line.quantity * line.unitCents;
  }, 0);

  const discountCents = Math.min(Math.max(input.discountCents ?? 0, 0), subtotalCents);
  assertIntegerCents(discountCents, 'discountCents');

  if (!Number.isInteger(input.taxRateBasisPoints) || input.taxRateBasisPoints < 0) {
    throw new Error('Tax rate must be non-negative basis points');
  }

  const taxableCents = Math.max(subtotalCents - discountCents, 0);
  const taxCents = Math.round((taxableCents * input.taxRateBasisPoints) / 10_000);
  const totalCents = taxableCents + taxCents;
  const amountReceivedCents = input.amountReceivedCents ?? null;
  if (amountReceivedCents !== null) assertIntegerCents(amountReceivedCents, 'amountReceivedCents');

  return {
    subtotalCents,
    discountCents,
    taxableCents,
    taxCents,
    totalCents,
    amountReceivedCents,
    changeDueCents: amountReceivedCents === null ? 0 : amountReceivedCents - totalCents,
  };
}

function assertIntegerCents(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be integer cents`);
  }
}
