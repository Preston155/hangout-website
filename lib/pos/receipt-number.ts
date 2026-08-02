export function formatReceiptNumber(prefix: string, year: number, sequence: number): string {
  if (!/^[A-Z0-9-]{2,12}$/.test(prefix)) {
    throw new Error('Receipt prefix must be 2-12 uppercase letters/numbers/dashes');
  }
  if (!Number.isInteger(year) || year < 2000) {
    throw new Error('Receipt year is invalid');
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Receipt sequence must be positive');
  }
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
}
