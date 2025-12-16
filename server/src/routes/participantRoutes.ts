import { Router } from 'express';
import {
  addParticipant,
  getParticipants,
  deleteParticipant,
} from '../controllers/participantController';

const router = Router();

router.post('/:sessionId/participants', addParticipant);
router.get('/:sessionId/participants', getParticipants);
router.delete('/:id', deleteParticipant);

export default router;
