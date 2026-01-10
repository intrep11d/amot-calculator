import { Request, Response } from 'express';
import prisma from '../prisma';

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.group.create({
      data: { name: name.trim() },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            friend: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        sessions: {
          include: {
            _count: {
              select: {
                participants: true,
                items: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.group.update({
      where: { id },
      data: { name: name.trim() },
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.group.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { friendCode } = req.body;

    if (!friendCode || typeof friendCode !== 'string') {
      return res.status(400).json({ error: 'Friend code is required' });
    }

    // Verify group exists
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Find friend by code
    const friend = await prisma.friend.findUnique({
      where: { friendCode },
    });

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Create group member
    const groupMember = await prisma.groupMember.create({
      data: {
        groupId: id,
        friendId: friend.id,
      },
      include: {
        friend: true,
      },
    });

    res.status(201).json(groupMember);
  } catch (error) {
    console.error('Error adding group member:', error);
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Friend is already a member of this group' });
    }
    res.status(500).json({ error: 'Failed to add group member' });
  }
};

export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;

    // Verify the member belongs to this group
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.groupId !== id) {
      return res.status(404).json({ error: 'Group member not found' });
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Failed to remove group member' });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify group exists
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        friend: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
};
