import { Prisma } from '@prisma/client';
import { SplitType } from './enums';

export interface SplitInput {
  participantId: string;
  splitType: SplitType;
  share?: number | string | Prisma.Decimal;
  percentage?: number | string | Prisma.Decimal;
}

export interface PaymentInput {
  participantId: string;
  amountPaid: number | string | Prisma.Decimal;
}

export interface CreateItemRequest {
  sessionId: string;
  description: string;
  totalAmount: number | string | Prisma.Decimal;
  paidById?: string;
  payments?: PaymentInput[];
  splits: SplitInput[];
}

export interface CalculatedSplit {
  participantId: string;
  splitType: SplitType;
  share: Prisma.Decimal;
  percentage?: Prisma.Decimal;
}

export interface ItemValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MarkPaymentRequest {
  creditorFriendId: string;
  debtorFriendId: string;
  amount: number | string | Prisma.Decimal;
  note?: string;
}
