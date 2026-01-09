import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { ParticipantBalance, Debt } from '../types/calculations';
import { toDecimal, compareCurrency, subtractCurrency } from '../utils/currency';

interface BalanceEntry {
  participantId: string;
  participantName: string;
  friendId: string | null;
  balance: Prisma.Decimal;
}

/**
 * Simplify debts using greedy algorithm
 * Matches largest creditor with largest debtor iteratively
 */
export function simplifyDebts(
  balances: ParticipantBalance[],
  tolerance: number = 0.01
): Debt[] {
  const debts: Debt[] = [];
  const toleranceDecimal = new Decimal(tolerance);

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors: BalanceEntry[] = balances
    .filter((b) => b.netBalance.greaterThan(toleranceDecimal))
    .map((b) => ({
      participantId: b.participantId,
      participantName: b.participantName,
      friendId: b.friendId,
      balance: toDecimal(b.netBalance),
    }))
    .sort((a, b) => compareCurrency(b.balance, a.balance)); // Descending

  const debtors: BalanceEntry[] = balances
    .filter((b) => b.netBalance.lessThan(-toleranceDecimal))
    .map((b) => ({
      participantId: b.participantId,
      participantName: b.participantName,
      friendId: b.friendId,
      balance: toDecimal(b.netBalance).abs(),
    }))
    .sort((a, b) => compareCurrency(b.balance, a.balance)); // Descending

  let i = 0;
  let j = 0;

  // Greedy matching
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Calculate payment amount (minimum of what creditor is owed and debtor owes)
    const amount = Decimal.min(creditor.balance, debtor.balance);

    if (amount.greaterThan(toleranceDecimal)) {
      debts.push({
        fromParticipantId: debtor.participantId,
        fromName: debtor.participantName,
        fromFriendId: debtor.friendId,
        toParticipantId: creditor.participantId,
        toName: creditor.participantName,
        toFriendId: creditor.friendId,
        amount: toDecimal(amount),
      });
    }

    // Update balances
    creditor.balance = subtractCurrency(creditor.balance, amount);
    debtor.balance = subtractCurrency(debtor.balance, amount);

    // Move to next creditor/debtor if settled
    if (creditor.balance.lessThanOrEqualTo(toleranceDecimal)) {
      i++;
    }
    if (debtor.balance.lessThanOrEqualTo(toleranceDecimal)) {
      j++;
    }
  }

  return debts;
}

/**
 * Calculate simplified debts for a session
 */
export async function calculateSessionDebts(sessionId: string): Promise<Debt[]> {
  // Import here to avoid circular dependency
  const { calculateNetBalances } = await import('./balanceCalculator');
  const balances = await calculateNetBalances(sessionId);
  return simplifyDebts(balances);
}
