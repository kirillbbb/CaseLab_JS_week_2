import { COOKIE_NAME, login, logout, me, refresh, register } from "../services/auth.service.js";

export async function registerHandler(req,res,next){try{res.status(201).json({data:await register(req.body,req.app.get("config"),res)});}catch(e){next(e);}}
export async function loginHandler(req,res,next){try{res.status(200).json({data:await login(req.body,req.app.get("config"),res)});}catch(e){next(e);}}
export async function refreshHandler(req,res,next){try{res.status(200).json({data:await refresh(req.cookies?.[COOKIE_NAME],req.app.get("config"),res)});}catch(e){next(e);}}
export async function logoutHandler(req,res,next){try{await logout(req.cookies?.[COOKIE_NAME],res,req.app.get("config"));res.status(204).send();}catch(e){next(e);}}
export async function meHandler(req,res,next){try{res.status(200).json({data:await me(req.user.sub)});}catch(e){next(e);}}
