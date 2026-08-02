import { z } from 'zod';
import { normalizeTireSize } from './tire-size';

export const paymentMethodSchema = z.enum(['Cash', 'Credit/debit card', 'Cash App', 'Zelle', 'Other']);

export const saleLineSchema = z.object({
  label: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(32),
  unitCents: z.number().int().min(0).max(1_000_000),
  type: z.enum(['tire', 'service', 'fee', 'discount']),
});

export const completeSaleSchema = z.object({
  idempotencyKey: z.string().min(12).max(120),
  tireSize: z.string().transform((value, ctx) => {
    const normalized = normalizeTireSize(value);
    if (!normalized.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: normalized.error ?? 'Invalid tire size' });
      return z.NEVER;
    }
    return normalized.value;
  }),
  condition: z.enum(['New', 'Used']),
  brand: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  customer: z
    .object({
      name: z.string().max(120).optional(),
      phone: z.string().max(40).optional(),
      email: z.string().email().optional().or(z.literal('')),
    })
    .optional(),
  vehicle: z
    .object({
      year: z.string().max(12).optional(),
      make: z.string().max(80).optional(),
      model: z.string().max(80).optional(),
      mileage: z.string().max(24).optional(),
      licensePlate: z.string().max(24).optional(),
    })
    .optional(),
  lines: z.array(saleLineSchema).min(1),
  discountCents: z.number().int().min(0).default(0),
  taxRateBasisPoints: z.number().int().min(0).max(2000),
  paymentMethod: paymentMethodSchema,
  amountReceivedCents: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
  warrantyNotes: z.string().max(2000).optional(),
});
