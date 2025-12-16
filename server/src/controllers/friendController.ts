import { Request, Response } from 'express';
import prisma from '../prisma';

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

    // Get all participants for this friend across all sessions
    const participants = await prisma.participant.findMany({
      where: { friendId: friend.id },
      include: {
        session: true,
        itemsPaid: {
          include: {
            splits: true,
          },
        },
        itemSplits: {
          include: {
            item: {
              include: {
                paidBy: {
                  include: {
                    friend: true,
                  },
                },
              },
            },
            participant: {
              include: {
                friend: true,
              },
            },
          },
        },
      },
    });

    // Calculate balance per session
    const sessionBalances = participants.map((participant) => {
      let balance = 0;

      // Add what they paid
      participant.itemsPaid.forEach((item) => {
        balance += item.totalAmount;
      });

      // Subtract what they owe
      participant.itemSplits.forEach((split) => {
        balance -= split.share;
      });

      return {
        sessionId: participant.sessionId,
        sessionName: participant.session.name,
        balance,
      };
    });

    // Calculate net balance
    const netBalance = sessionBalances.reduce((sum, s) => sum + s.balance, 0);

    // Calculate by-friend breakdown (aggregate across sessions)
    const byFriendMap = new Map<string, { name: string; amount: number }>();

    participants.forEach((participant) => {
      // Process items they paid for
      participant.itemsPaid.forEach((item) => {
        item.splits.forEach((split) => {
          // Find who this split belongs to
          const splitParticipant = participants.find(
            (p) => p.id === split.participantId
          );

          if (splitParticipant && splitParticipant.friendId) {
            const key = splitParticipant.friendId;
            const existing = byFriendMap.get(key) || {
              name: splitParticipant.name,
              amount: 0,
            };
            // They are owed this amount
            existing.amount += split.share;
            byFriendMap.set(key, existing);
          }
        });
      });

      // Process items they owe
      participant.itemSplits.forEach((split) => {
        const payer = split.item.paidBy;
        if (payer.friendId && payer.friendId !== friend.id) {
          const key = payer.friendId;
          const existing = byFriendMap.get(key) || {
            name: payer.name,
            amount: 0,
          };
          // They owe this amount
          existing.amount -= split.share;
          byFriendMap.set(key, existing);
        }
      });
    });

    const byFriend = Array.from(byFriendMap.entries()).map(([friendId, data]) => ({
      friendId,
      friendName: data.name,
      amount: data.amount,
    }));

    res.json({
      netBalance,
      bySession: sessionBalances,
      byFriend,
    });
  } catch (error) {
    console.error('Error calculating friend balance:', error);
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
};
