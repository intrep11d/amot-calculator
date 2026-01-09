import { Request, Response } from 'express';
import prisma from '../prisma';
import { calculateFriendSettlement } from '../services/friendAggregator';

export const createFriend = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const friend = await prisma.friend.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(friend);
  } catch (error) {
    console.error('Error creating friend:', error);
    res.status(500).json({ error: 'Failed to create friend' });
  }
};

export const getFriendByCode = async (req: Request, res: Response) => {
  try {
    const { friendCode } = req.params;

    const friend = await prisma.friend.findUnique({
      where: { friendCode },
      include: {
        participants: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    res.json(friend);
  } catch (error) {
    console.error('Error getting friend:', error);
    res.status(500).json({ error: 'Failed to get friend' });
  }
};

export const updateFriend = async (req: Request, res: Response) => {
  try {
    const { friendCode } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const friend = await prisma.friend.update({
      where: { friendCode },
      data: {
        name: name.trim(),
      },
    });

    res.json(friend);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Friend not found' });
    }
    console.error('Error updating friend:', error);
    res.status(500).json({ error: 'Failed to update friend' });
  }
};

export const getFriendBalance = async (req: Request, res: Response) => {
  try {
    const { friendCode } = req.params;

    // First verify friend exists
    const friend = await prisma.friend.findUnique({
      where: { friendCode },
    });

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Use our new friend aggregation service
    const settlement = await calculateFriendSettlement(friend.id);

    // Transform response to match frontend expectations
    // Frontend expects: { netBalance, byFriend[], bySession[] }

    // 1. Build byFriend array (combines owesTo and owedBy)
    const byFriend: Array<{ friendId: string; friendName: string; amount: number }> = [];

    // Add people you owe (negative amounts)
    settlement.owesTo.forEach((debt) => {
      byFriend.push({
        friendId: debt.toFriendId,
        friendName: debt.toFriendName,
        amount: -Number(debt.amount.toFixed(2)), // Negative because you owe them
      });
    });

    // Add people who owe you (positive amounts)
    settlement.owedBy.forEach((debt) => {
      byFriend.push({
        friendId: debt.fromFriendId,
        friendName: debt.fromFriendName,
        amount: Number(debt.amount.toFixed(2)), // Positive because they owe you
      });
    });

    // 2. Build bySession array (aggregate session breakdowns)
    const sessionMap = new Map<string, { sessionName: string; balance: number }>();

    // Subtract amounts from sessions where you owe
    settlement.owesTo.forEach((debt) => {
      debt.sessionBreakdown.forEach((sb) => {
        const existing = sessionMap.get(sb.sessionId) || { sessionName: sb.sessionName, balance: 0 };
        existing.balance -= Number(sb.amount.toFixed(2)); // You owe, so negative
        sessionMap.set(sb.sessionId, existing);
      });
    });

    // Add amounts from sessions where you're owed
    settlement.owedBy.forEach((debt) => {
      debt.sessionBreakdown.forEach((sb) => {
        const existing = sessionMap.get(sb.sessionId) || { sessionName: sb.sessionName, balance: 0 };
        existing.balance += Number(sb.amount.toFixed(2)); // They owe you, so positive
        sessionMap.set(sb.sessionId, existing);
      });
    });

    const bySession = Array.from(sessionMap.entries()).map(([sessionId, data]) => ({
      sessionId,
      sessionName: data.sessionName,
      balance: Number(data.balance.toFixed(2)), // Round to 2 decimal places
    }));

    res.json({
      netBalance: Number(settlement.netBalance.toFixed(2)),
      byFriend,
      bySession,
    });
  } catch (error) {
    console.error('Error calculating friend balance:', error);
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
};
