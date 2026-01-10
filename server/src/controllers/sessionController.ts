import { Request, Response } from 'express';
import prisma from '../prisma';
import { serializeDecimals } from '../utils/serialization';

export const createSession = async (req: Request, res: Response) => {
  try {
    const { name, groupId } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Session name is required' });
    }

    // If groupId is provided, verify the group exists
    if (groupId) {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
    }

    const session = await prisma.session.create({
      data: {
        name,
        groupId: groupId || null,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;

    const sessions = await prisma.session.findMany({
      where: groupId ? { groupId: groupId as string } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        group: true,
        _count: {
          select: {
            participants: true,
            items: true,
          },
        },
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        group: true,
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

    res.json(serializeDecimals(session));
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.session.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};
