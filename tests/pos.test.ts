import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSaleTotals, cents, formatMoney } from '../lib/pos/money.ts';
import { formatReceiptNumber } from '../lib/pos/receipt-number.ts';
import { MockPrinterAdapter } from '../lib/pos/printer.ts';
import { normalizeTireSize } from '../lib/pos/tire-size.ts';

test('calculates subtotal, tax, total, and cash change using integer cents', () => {
  const totals = calculateSaleTotals({
    lines: [
      { quantity: 1, unitCents: cents(240) },
      { quantity: 1, unitCents: cents(80) },
      { quantity: 1, unitCents: cents(16) },
    ],
    discountCents: cents(0),
    taxRateBasisPoints: 725,
    amountReceivedCents: cents(400),
  });

  assert.equal(totals.subtotalCents, 33_600);
  assert.equal(totals.taxCents, 2_436);
  assert.equal(totals.totalCents, 36_036);
  assert.equal(totals.changeDueCents, 3_964);
  assert.equal(formatMoney(totals.totalCents), '$360.36');
});

test('caps discounts at subtotal', () => {
  const totals = calculateSaleTotals({
    lines: [{ quantity: 1, unitCents: cents(50) }],
    discountCents: cents(999),
    taxRateBasisPoints: 725,
  });
  assert.equal(totals.totalCents, 0);
});

test('normalizes tire sizes with slash or R variations', () => {
  assert.deepEqual(normalizeTireSize('215/65R17').value, '215/65R17');
  assert.deepEqual(normalizeTireSize('215 65 17').value, '215/65R17');
  assert.deepEqual(normalizeTireSize('215/65r17').value, '215/65R17');
  assert.equal(normalizeTireSize('bad-size').ok, false);
});

test('formats receipt numbers', () => {
  assert.equal(formatReceiptNumber('ATS', 2026, 1), 'ATS-2026-000001');
  assert.throws(() => formatReceiptNumber('bad prefix', 2026, 1));
});

test('mock printer supports successful status and receipt printing', async () => {
  const printer = new MockPrinterAdapter();
  assert.equal((await printer.testConnection()).ok, true);
  await printer.printReceipt({
    receiptNumber: 'ATS-2026-000001',
    receiptText: 'Test receipt',
    qrUrl: 'https://prestonhq.com',
    openDrawer: false,
    cutPaper: true,
  });
});
