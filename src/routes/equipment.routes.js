import { Router } from "express";

import {
  getEquipmentListHandler,
  getEquipment,
  createEquipmentHandler,
  updateEquipmentHandler,
  deleteEquipmentHandler,
} from "../controllers/equipment.controller.js";

import { validateEquipmentQuery } from "../middlewares/validateEquipmentQuery.js";

import {
  validateCreateEquipmentBody,
  validateUpdateEquipmentBody,
} from "../middlewares/validateEquipmentBody.js";

import { getByEquipment } from "../controllers/request.controller.js";

export function createEquipmentRouter({ weatherController }) {
  const router = Router();

  router.get("/", validateEquipmentQuery, getEquipmentListHandler);

  router.get("/:equipmentId/requests", getByEquipment);

  router.get("/:id/weather", weatherController.getEquipmentWeather);

  router.get("/:id", getEquipment);

  router.post("/", validateCreateEquipmentBody, createEquipmentHandler);

  router.patch("/:id", validateUpdateEquipmentBody, updateEquipmentHandler);

  router.delete("/:id", deleteEquipmentHandler);

  return router;
}
