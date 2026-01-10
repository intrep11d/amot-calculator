import { Router } from 'express';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  getGroupMembers,
} from '../controllers/groupController';

const router = Router();

// Group CRUD
router.post('/', createGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

// Group member management
router.post('/:id/members', addGroupMember);
router.get('/:id/members', getGroupMembers);
router.delete('/:id/members/:memberId', removeGroupMember);

export default router;
