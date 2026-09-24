import { Router } from "express";
import { validateRequestQueryMiddleware } from "../middlewares/requestQueryValidation.js";

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

router.get("/:id", get);

router.patch("/:id/status", validateStatusBody, changeStatus);

router.patch("/:id", validateUpdate, update);

router.delete("/:id", remove);

export default router;
