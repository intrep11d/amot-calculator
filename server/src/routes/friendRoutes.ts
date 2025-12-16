import { Router } from 'express';
import {
  createFriend,
  getFriendByCode,
  updateFriend,
  getFriendBalance,
} from '../controllers/friendController';

const router = Router();

router.post('/', createFriend);
router.get('/:friendCode', getFriendByCode);
router.put('/:friendCode', updateFriend);
router.get('/:friendCode/balance', getFriendBalance);

export default router;
