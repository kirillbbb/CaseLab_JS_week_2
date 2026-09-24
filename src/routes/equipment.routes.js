import { Router } from "express";

import {
  getEquipmentListHandler,
  getEquipment,
  createEquipmentHandler,
  updateEquipmentHandler,
  deleteEquipmentHandler,
} from "../controllers/equipment.controller.js";

import { validateEquipmentQuery } from "../middlewares/validateEquipmentQuery.js";
import { validateParams } from "../middlewares/validateParams.js";

import {
  validateCreateEquipmentBody,
  validateUpdateEquipmentBody,
} from "../middlewares/validateEquipmentBody.js";

import { getByEquipment } from "../controllers/request.controller.js";

export function createEquipmentRouter({ weatherController }) {
  const router = Router();

  router.get("/", validateEquipmentQuery, getEquipmentListHandler);

  router.get(
    "/:equipmentId/requests",
    validateParams("equipmentId"),
    getByEquipment,
  );

  router.get(
    "/:id/weather",
    validateParams("id"),
    weatherController.getEquipmentWeather,
  );

  router.get("/:id", validateParams("id"), getEquipment);

  router.post("/", validateCreateEquipmentBody, createEquipmentHandler);

  router.patch(
    "/:id",
    validateParams("id"),
    validateUpdateEquipmentBody,
    updateEquipmentHandler,
  );

  router.delete("/:id", validateParams("id"), deleteEquipmentHandler);

  return router;
}
