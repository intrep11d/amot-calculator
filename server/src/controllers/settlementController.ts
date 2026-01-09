import { Request, Response } from 'express';
import prisma from '../prisma';
import { calculateNetBalances } from '../services/balanceCalculator';
import { simplifyDebts } from '../services/debtSimplifier';

export const getSettlements = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate balances using our new service
    const balances = await calculateNetBalances(sessionId);

    // Simplify debts using greedy algorithm
    const debtsCalculated = simplifyDebts(balances);

    // Convert to API response format
    const debts = debtsCalculated.map((debt) => ({
      from: debt.fromParticipantId,
      fromName: debt.fromName,
      to: debt.toParticipantId,
      toName: debt.toName,
      amount: Number(debt.amount.toFixed(2)),
    }));

    const participantSummaries = balances.map((balance) => ({
      participantId: balance.participantId,
      name: balance.participantName,
      totalPaid: Number(balance.totalPaid.toFixed(2)),
      totalOwed: Number(balance.totalOwed.toFixed(2)),
      netBalance: Number(balance.netBalance.toFixed(2)),
    }));

    res.json({
      debts,
      participantSummaries,
    });
  } catch (error) {
    console.error('Error calculating settlements:', error);
    res.status(500).json({ error: 'Failed to calculate settlements' });
  }
};
