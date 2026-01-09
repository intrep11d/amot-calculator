import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../prisma';
import { ParticipantBalance } from '../types/calculations';
import { addCurrency, subtractCurrency, toDecimal } from '../utils/currency';

/**
 * Calculate net balances for all participants in a session
 * Supports both single-payer and multi-payer items
 */
export async function calculateNetBalances(
  sessionId: string
): Promise<ParticipantBalance[]> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          friend: true,
        },
      },
      items: {
        include: {
          paidBy: true,
          payments: {
            include: {
              participant: true,
            },
          },
          splits: {
            include: {
              participant: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Initialize balances for all participants
  const balanceMap = new Map<string, ParticipantBalance>();
  for (const participant of session.participants) {
    balanceMap.set(participant.id, {
      participantId: participant.id,
      participantName: participant.name,
      friendId: participant.friendId,
      totalPaid: new Decimal(0),
      totalOwed: new Decimal(0),
      netBalance: new Decimal(0),
    });
  }

  // Process each item
  for (const item of session.items) {
    // Credit payers
    if (item.paidById) {
      // Single-payer (backward compatible)
      const balance = balanceMap.get(item.paidById);
      if (balance) {
        balance.totalPaid = addCurrency(balance.totalPaid, item.totalAmount);
      }
    } else {
      // Multi-payer
      for (const payment of item.payments) {
        const balance = balanceMap.get(payment.participantId);
        if (balance) {
          balance.totalPaid = addCurrency(
            balance.totalPaid,
            payment.amountPaid
          );
        }
      }
    }

    // Debit splits
    for (const split of item.splits) {
      const balance = balanceMap.get(split.participantId);
      if (balance) {
        balance.totalOwed = addCurrency(balance.totalOwed, split.share);
      }
    }
  }

  // Calculate net balances
  for (const balance of balanceMap.values()) {
    balance.netBalance = subtractCurrency(
      balance.totalPaid,
      balance.totalOwed
    );
  }

  return Array.from(balanceMap.values());
}

/**
 * Get balance for a specific participant
 */
export async function getParticipantBalance(
  sessionId: string,
  participantId: string
): Promise<ParticipantBalance | null> {
  const balances = await calculateNetBalances(sessionId);
  return balances.find((b) => b.participantId === participantId) || null;
}
