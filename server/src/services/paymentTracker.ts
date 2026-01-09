import { PaymentRecord } from '@prisma/client';
import prisma from '../prisma';
import { CurrencyValue } from '../types/currency';
import { toDecimal } from '../utils/currency';

/**
 * Mark a debt as paid (creditor-controlled)
 * Only the creditor (person who is owed) can mark a debt as paid
 */
export async function markDebtAsPaid(
  creditorFriendId: string,
  debtorFriendId: string,
  amount: CurrencyValue,
  note?: string
): Promise<PaymentRecord> {
  const amountDecimal = toDecimal(amount);

  if (amountDecimal.lessThanOrEqualTo(0)) {
    throw new Error('Payment amount must be positive');
  }

  // Verify both friends exist
  const [creditor, debtor] = await Promise.all([
    prisma.friend.findUnique({ where: { id: creditorFriendId } }),
    prisma.friend.findUnique({ where: { id: debtorFriendId } }),
  ]);

  if (!creditor) {
    throw new Error(`Creditor friend not found: ${creditorFriendId}`);
  }

  if (!debtor) {
    throw new Error(`Debtor friend not found: ${debtorFriendId}`);
  }

  // Create payment record
  return prisma.paymentRecord.create({
    data: {
      creditorFriendId,
      debtorFriendId,
      amount: amountDecimal,
      note,
    },
  });
}

/**
 * Get all payment records for a friend (both owed and owing)
 */
export async function getFriendPaymentRecords(
  friendId: string
): Promise<{
  paymentsMarkedByMe: PaymentRecord[];
  paymentsMarkedForMe: PaymentRecord[];
}> {
  const [paymentsMarkedByMe, paymentsMarkedForMe] = await Promise.all([
    // Payments this friend marked (as creditor)
    prisma.paymentRecord.findMany({
      where: { creditorFriendId: friendId },
      include: {
        debtor: true,
      },
      orderBy: { markedPaidAt: 'desc' },
    }),
    // Payments marked for this friend (as debtor)
    prisma.paymentRecord.findMany({
      where: { debtorFriendId: friendId },
      include: {
        creditor: true,
      },
      orderBy: { markedPaidAt: 'desc' },
    }),
  ]);

  return {
    paymentsMarkedByMe,
    paymentsMarkedForMe,
  };
}

/**
 * Get payment history between two friends
 */
export async function getPaymentHistoryBetweenFriends(
  friendId1: string,
  friendId2: string
): Promise<PaymentRecord[]> {
  return prisma.paymentRecord.findMany({
    where: {
      OR: [
        { creditorFriendId: friendId1, debtorFriendId: friendId2 },
        { creditorFriendId: friendId2, debtorFriendId: friendId1 },
      ],
    },
    include: {
      creditor: true,
      debtor: true,
    },
    orderBy: { markedPaidAt: 'desc' },
  });
}

/**
 * Delete a payment record (only if created by mistake)
 */
export async function deletePaymentRecord(
  paymentRecordId: string,
  creditorFriendId: string
): Promise<void> {
  const record = await prisma.paymentRecord.findUnique({
    where: { id: paymentRecordId },
  });

  if (!record) {
    throw new Error(`Payment record not found: ${paymentRecordId}`);
  }

  // Only the creditor who created it can delete it
  if (record.creditorFriendId !== creditorFriendId) {
    throw new Error('Only the creditor can delete this payment record');
  }

  await prisma.paymentRecord.delete({
    where: { id: paymentRecordId },
  });
}
