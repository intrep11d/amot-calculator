import { Request, Response } from 'express';
import prisma from '../prisma';

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { name, friendCode } = req.body;

    // If friendCode is provided, validate and link to friend
    if (friendCode) {
      const friend = await prisma.friend.findUnique({
        where: { friendCode },
      });

      if (!friend) {
        return res.status(404).json({ error: 'Friend not found' });
      }

      const participant = await prisma.participant.create({
        data: {
          name: friend.name, // Use friend's name
          sessionId,
          friendId: friend.id,
        },
        include: {
          friend: true,
        },
      });

      return res.status(201).json(participant);
    }

    // Legacy flow: create participant with name only
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    const participant = await prisma.participant.create({
      data: {
        name,
        sessionId,
      },
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const participants = await prisma.participant.findMany({
      where: { sessionId },
      include: {
        friend: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};

export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        itemsPaid: true,
        itemSplits: true,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.itemsPaid.length > 0 || participant.itemSplits.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete participant with existing items or splits',
      });
    }

    await prisma.participant.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
};
