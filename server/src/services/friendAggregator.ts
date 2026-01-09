import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../prisma';
import { FriendSettlement, FriendDebt, SessionDebtBreakdown } from '../types/calculations';
import { calculateNetBalances } from './balanceCalculator';
import { simplifyDebts } from './debtSimplifier';
import { addCurrency, subtractCurrency, toDecimal } from '../utils/currency';

/**
 * Calculate friend-level settlement aggregated across all sessions
 */
export async function calculateFriendSettlement(
  friendId: string
): Promise<FriendSettlement> {
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
    include: {
      participants: {
        include: {
          session: true,
        },
      },
    },
  });

  if (!friend) {
    throw new Error(`Friend not found: ${friendId}`);
  }

  const owesToMap = new Map<string, FriendDebt>();
  const owedByMap = new Map<string, FriendDebt>();

  // Process each session this friend participated in
  for (const participant of friend.participants) {
    const balances = await calculateNetBalances(participant.sessionId);
    const debts = simplifyDebts(balances);

    for (const debt of debts) {
      // Friend owes someone
      if (debt.fromFriendId === friendId && debt.toFriendId) {
        const existing = owesToMap.get(debt.toFriendId);
        if (existing) {
          existing.amount = addCurrency(existing.amount, debt.amount);
          existing.sessionBreakdown.push({
            sessionId: participant.sessionId,
            sessionName: participant.session.name,
            amount: toDecimal(debt.amount),
          });
        } else {
          owesToMap.set(debt.toFriendId, {
            fromFriendId: friendId,
            fromFriendName: friend.name,
            toFriendId: debt.toFriendId,
            toFriendName: debt.toName,
            amount: toDecimal(debt.amount),
            sessionBreakdown: [
              {
                sessionId: participant.sessionId,
                sessionName: participant.session.name,
                amount: toDecimal(debt.amount),
              },
            ],
          });
        }
      }

      // Someone owes friend
      if (debt.toFriendId === friendId && debt.fromFriendId) {
        const existing = owedByMap.get(debt.fromFriendId);
        if (existing) {
          existing.amount = addCurrency(existing.amount, debt.amount);
          existing.sessionBreakdown.push({
            sessionId: participant.sessionId,
            sessionName: participant.session.name,
            amount: toDecimal(debt.amount),
          });
        } else {
          owedByMap.set(debt.fromFriendId, {
            fromFriendId: debt.fromFriendId,
            fromFriendName: debt.fromName,
            toFriendId: friendId,
            toFriendName: friend.name,
            amount: toDecimal(debt.amount),
            sessionBreakdown: [
              {
                sessionId: participant.sessionId,
                sessionName: participant.session.name,
                amount: toDecimal(debt.amount),
              },
            ],
          });
        }
      }
    }
  }

  const owesTo = Array.from(owesToMap.values());
  const owedBy = Array.from(owedByMap.values());

  const totalOwed = owesTo.reduce(
    (sum, d) => addCurrency(sum, d.amount),
    new Decimal(0)
  );

  const totalOwedBy = owedBy.reduce(
    (sum, d) => addCurrency(sum, d.amount),
    new Decimal(0)
  );

  const netBalance = subtractCurrency(totalOwedBy, totalOwed);

  return {
    friendId,
    friendName: friend.name,
    netBalance,
    owesTo,
    owedBy,
    totalOwed,
    totalOwedBy,
  };
}

/**
 * Get friend settlement by friend code
 */
export async function calculateFriendSettlementByCode(
  friendCode: string
): Promise<FriendSettlement> {
  const friend = await prisma.friend.findUnique({
    where: { friendCode },
  });

  if (!friend) {
    throw new Error(`Friend not found with code: ${friendCode}`);
  }

  return calculateFriendSettlement(friend.id);
}
