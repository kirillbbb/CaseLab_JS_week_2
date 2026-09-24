import { Router } from "express";

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

router.get("/", list);

router.post("/", validateCreate, create);

router.get("/:id", get);

router.patch("/:id/status", validateStatusBody, changeStatus);

router.patch("/:id", validateUpdate, update);

router.delete("/:id", remove);

export default router;
