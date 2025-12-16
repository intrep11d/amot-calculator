import { Request, Response } from 'express';
import prisma from '../prisma';

interface Balance {
  [participantId: string]: {
    name: string;
    balance: number;
    totalPaid: number;
    totalOwed: number;
  };
}

interface Debt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export const getSettlements = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        items: {
          include: {
            paidBy: true,
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
      return res.status(404).json({ error: 'Session not found' });
    }

    const balances: Balance = {};

    session.participants.forEach((participant) => {
      balances[participant.id] = {
        name: participant.name,
        balance: 0,
        totalPaid: 0,
        totalOwed: 0,
      };
    });

    session.items.forEach((item) => {
      if (balances[item.paidById]) {
        balances[item.paidById].balance += item.totalAmount;
        balances[item.paidById].totalPaid += item.totalAmount;
      }

      item.splits.forEach((split) => {
        if (balances[split.participantId]) {
          balances[split.participantId].balance -= split.share;
          balances[split.participantId].totalOwed += split.share;
        }
      });
    });

    const debts: Debt[] = [];

    const creditors = Object.entries(balances)
      .filter(([, data]) => data.balance > 0.01)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = Object.entries(balances)
      .filter(([, data]) => data.balance < -0.01)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        debts.push({
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
          toName: creditor.name,
          amount: Number(amount.toFixed(2)),
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    const participantSummaries = Object.entries(balances).map(([id, data]) => ({
      participantId: id,
      name: data.name,
      totalPaid: Number(data.totalPaid.toFixed(2)),
      totalOwed: Number(data.totalOwed.toFixed(2)),
      netBalance: Number((data.totalPaid - data.totalOwed).toFixed(2)),
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
