import { Request, Response } from 'express';
import prisma from '../prisma';
import { serializeDecimals } from '../utils/serialization';

export const addItem = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { description, totalAmount, paidById, splits } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Item description is required' });
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    if (!paidById || typeof paidById !== 'string') {
      return res.status(400).json({ error: 'paidById is required' });
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ error: 'At least one split is required' });
    }

    const totalSplits = splits.reduce((sum, split) => sum + split.share, 0);
    if (Math.abs(totalSplits - totalAmount) > 0.01) {
      return res.status(400).json({
        error: 'Sum of splits must equal total amount',
      });
    }

    const item = await prisma.item.create({
      data: {
        description,
        totalAmount,
        paidById,
        sessionId,
        splits: {
          create: splits.map((split: { participantId: string; share: number }) => ({
            participantId: split.participantId,
            share: split.share,
          })),
        },
      },
      include: {
        paidBy: true,
        splits: {
          include: {
            participant: true,
          },
        },
      },
    });

    res.status(201).json(serializeDecimals(item));
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const items = await prisma.item.findMany({
      where: { sessionId },
      include: {
        paidBy: true,
        splits: {
          include: {
            participant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(serializeDecimals(items));
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, totalAmount, paidById, splits } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Item description is required' });
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    if (!paidById || typeof paidById !== 'string') {
      return res.status(400).json({ error: 'paidById is required' });
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ error: 'At least one split is required' });
    }

    const totalSplits = splits.reduce((sum, split) => sum + split.share, 0);
    if (Math.abs(totalSplits - totalAmount) > 0.01) {
      return res.status(400).json({
        error: 'Sum of splits must equal total amount',
      });
    }

    await prisma.itemSplit.deleteMany({
      where: { itemId: id },
    });

    const item = await prisma.item.update({
      where: { id },
      data: {
        description,
        totalAmount,
        paidById,
        splits: {
          create: splits.map((split: { participantId: string; share: number }) => ({
            participantId: split.participantId,
            share: split.share,
          })),
        },
      },
      include: {
        paidBy: true,
        splits: {
          include: {
            participant: true,
          },
        },
      },
    });

    res.json(serializeDecimals(item));
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.item.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
