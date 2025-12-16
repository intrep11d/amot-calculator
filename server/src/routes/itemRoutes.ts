import { Router } from 'express';
import {
  addItem,
  getItems,
  updateItem,
  deleteItem,
} from '../controllers/itemController';

const router = Router();

router.post('/:sessionId/items', addItem);
router.get('/:sessionId/items', getItems);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
