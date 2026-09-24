import { Router } from 'express';

import {
  getEquipmentListHandler,
  getEquipment,
  createEquipmentHandler,
  updateEquipmentHandler,
  deleteEquipmentHandler,
} from '../controllers/equipment.controller.js';

import { validateEquipmentQuery } from '../middlewares/validateEquipmentQuery.js';
import {
  validateCreateEquipmentBody,
  validateUpdateEquipmentBody,
} from '../middlewares/validateEquipmentBody.js';

const router = Router();

router.get('/', validateEquipmentQuery, getEquipmentListHandler);

router.get('/:id', getEquipment);

router.post(
  '/',
  validateCreateEquipmentBody,
  createEquipmentHandler,
);

router.patch(
  '/:id',
  validateUpdateEquipmentBody,
  updateEquipmentHandler,
);

router.delete('/:id', deleteEquipmentHandler);

export default router;