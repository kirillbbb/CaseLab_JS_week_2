import { Router } from "express";

import { validateRequestQueryMiddleware } from "../middlewares/requestQueryValidation.js";
import { validateParams } from "../middlewares/validateParams.js";

import {
  list,
  get,
  create,
  update,
  changeStatus,
  remove,
} from "../controllers/request.controller.js";

import {
  validateCreate,
  validateUpdate,
  validateStatusBody,
} from "../middlewares/requestValidation.js";

const router = Router();

router.get("/", validateRequestQueryMiddleware, list);

router.post("/", validateCreate, create);

router.get("/:id", validateParams("id"), get);

router.patch(
  "/:id/status",
  validateParams("id"),
  validateStatusBody,
  changeStatus,
);

router.patch("/:id", validateParams("id"), validateUpdate, update);

router.delete("/:id", validateParams("id"), remove);

export default router;
