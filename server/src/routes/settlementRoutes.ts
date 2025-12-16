import { Router } from 'express';
import { getSettlements } from '../controllers/settlementController';

const router = Router();

router.get('/:sessionId/settlements', getSettlements);

export default router;
