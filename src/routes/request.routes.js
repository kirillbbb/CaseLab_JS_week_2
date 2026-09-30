import { Router } from "express";
import {
  list, get, create, update, changeStatus, remove,
  assignTeam, removeAssignee, history,
} from "../controllers/request.controller.js";
import { validateRequestQueryMiddleware } from "../middlewares/requestQueryValidation.js";
import { validateParams } from "../middlewares/validateParams.js";
import { validateCreate, validateUpdate, validateStatusBody } from "../middlewares/requestValidation.js";

const router = Router();

router.get("/", validateRequestQueryMiddleware, list);
router.post("/", validateCreate, create);
router.get("/:id", validateParams("id"), get);
router.post("/:id/assignees", validateParams("id"), assignTeam);
router.delete("/:id/assignees/:userId", validateParams("id", "userId"), removeAssignee);
router.get("/:id/history", validateParams("id"), history);
router.patch("/:id/status", validateParams("id"), validateStatusBody, changeStatus);
router.patch("/:id", validateParams("id"), validateUpdate, update);
router.delete("/:id", validateParams("id"), remove);

export default router;