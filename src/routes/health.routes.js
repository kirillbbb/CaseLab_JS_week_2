import { Router } from "express";
import { live, ready } from "../controllers/health.controller.js";
export const healthRouter = Router();
healthRouter.get("/live", live);
healthRouter.get("/ready", ready);
