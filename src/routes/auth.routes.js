import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginHandler,logoutHandler,meHandler,refreshHandler,registerHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export function createAuthRouter(config){
  const router=Router();
  const loginLimiter=rateLimit({windowMs:config.loginRateLimitWindowMs,limit:config.loginRateLimitMax,standardHeaders:"draft-8",legacyHeaders:false,message:{error:{code:"LOGIN_RATE_LIMITED",message:"Too many login attempts, try again later"}}});
  router.post("/register",registerHandler);
  router.post("/login",loginLimiter,loginHandler);
  router.post("/refresh",refreshHandler);
  router.post("/logout",logoutHandler);
  router.get("/me",requireAuth(),meHandler);
  return router;
}
