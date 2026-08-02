import type { PaymentMethod as DbPaymentMethod, TireCondition as DbTireCondition, TransactionStatus } from '@prisma/client';

export type UiPaymentMethod = 'Cash' | 'Credit/debit card' | 'Cash App' | 'Zelle' | 'Other';
export type UiTireCondition = 'New' | 'Used';
export type UiTransactionStatus = 'Saved' | 'Printed' | 'Print failed' | 'Refunded' | 'Voided';

export function toDbPaymentMethod(value: UiPaymentMethod): DbPaymentMethod {
  switch (value) {
    case 'Cash':
      return 'CASH';
    case 'Credit/debit card':
      return 'CARD_EXTERNAL';
    case 'Cash App':
      return 'CASH_APP';
    case 'Zelle':
      return 'ZELLE';
    case 'Other':
      return 'OTHER';
  }
}

export function toUiPaymentMethod(value: DbPaymentMethod): UiPaymentMethod {
  switch (value) {
    case 'CASH':
      return 'Cash';
    case 'CARD_EXTERNAL':
      return 'Credit/debit card';
    case 'CASH_APP':
      return 'Cash App';
    case 'ZELLE':
      return 'Zelle';
    case 'OTHER':
      return 'Other';
  }
}

export function toDbTireCondition(value: UiTireCondition): DbTireCondition {
  return value === 'New' ? 'NEW' : 'USED';
}

export function toUiStatus(status: TransactionStatus, printed: boolean, failedPrint: boolean): UiTransactionStatus {
  if (status === 'VOIDED') return 'Voided';
  if (status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') return 'Refunded';
  if (failedPrint) return 'Print failed';
  if (printed) return 'Printed';
  return 'Saved';
}
