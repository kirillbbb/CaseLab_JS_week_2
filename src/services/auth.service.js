import crypto from "node:crypto";
import { User, RefreshToken } from "../models/index.js";
import { AppError } from "../errors/AppError.js";

const ACCESS_TTL=15*60;
const REFRESH_TTL=7*24*60*60*1000;
const COOKIE_NAME="caselab_refresh";
const b64=v=>Buffer.from(v).toString("base64url");

function sign(payload,secret){
  const h=b64(JSON.stringify({alg:"HS256",typ:"JWT"})),b=b64(JSON.stringify(payload));
  const s=crypto.createHmac("sha256",secret).update(h+"."+b).digest("base64url");
  return h+"."+b+"."+s;
}
function decode(token){const p=String(token).split(".");if(p.length!==3)throw new Error("invalid");return {h:p[0],b:p[1],s:p[2],p:JSON.parse(Buffer.from(p[1],"base64url").toString())};}
export function hashPassword(password,salt=crypto.randomBytes(16).toString("hex")){return "scrypt$"+salt+"$"+crypto.scryptSync(password,salt,64).toString("hex");}
export function verifyPassword(password,stored){const p=String(stored).split("$");if(p.length!==3||p[0]!=="scrypt")return false;const a=crypto.scryptSync(password,p[1],64).toString("hex");return a.length===p[2].length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(p[2]));}
export function issueAccessToken(user,config){const now=Math.floor(Date.now()/1000);return sign({sub:user.id,email:user.email,role:user.role,iat:now,exp:now+ACCESS_TTL},config.jwtSecret);}
export function verifyAccessToken(token,config){const d=decode(token),e=crypto.createHmac("sha256",config.jwtSecret).update(d.h+"."+d.b).digest("base64url");if(d.s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(d.s),Buffer.from(e))||d.p.exp<=Math.floor(Date.now()/1000))throw new Error("invalid");return d.p;}
function hashRefresh(token){return crypto.createHash("sha256").update(token).digest("hex");}
function setCookie(res,token,config){let v=COOKIE_NAME+"="+encodeURIComponent(token)+"; Max-Age="+Math.floor(REFRESH_TTL/1000)+"; Path=/api/auth; HttpOnly; SameSite=Strict";if(config.nodeEnv==="production")v+="; Secure";res.setHeader("Set-Cookie",v);}
function clearCookie(res,config){let v=COOKIE_NAME+"=; Max-Age=0; Path=/api/auth; HttpOnly; SameSite=Strict";if(config.nodeEnv==="production")v+="; Secure";res.setHeader("Set-Cookie",v);}
async function createSession(userId,res,config){const token=crypto.randomBytes(48).toString("base64url");await RefreshToken.create({id:crypto.randomUUID(),userId,tokenHash:hashRefresh(token),expiresAt:new Date(Date.now()+REFRESH_TTL),createdAt:new Date()});setCookie(res,token,config);}
export function safeUser(user){return{id:user.id,email:user.email,role:user.role,createdAt:user.createdAt};}
export async function register(data,config,res){const email=String(data.email??"").trim().toLowerCase(),password=String(data.password??"");if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8)throw new AppError(422,"VALIDATION_ERROR","Email is invalid or password is shorter than 8 characters");if(await User.findOne({where:{email}}))throw new AppError(409,"EMAIL_ALREADY_EXISTS","A user with this email already exists");const user=await User.create({id:crypto.randomUUID(),email,passwordHash:hashPassword(password),role:"viewer"});const accessToken=issueAccessToken(user,config);await createSession(user.id,res,config);return{user:safeUser(user),accessToken};}
export async function login(data,config,res){const email=String(data.email??"").trim().toLowerCase(),password=String(data.password??""),user=await User.findOne({where:{email}});if(!user||!verifyPassword(password,user.passwordHash))throw new AppError(401,"INVALID_CREDENTIALS","Invalid email or password");const accessToken=issueAccessToken(user,config);await createSession(user.id,res,config);return{user:safeUser(user),accessToken};}
export async function refresh(token,config,res){if(!token)throw new AppError(401,"REFRESH_TOKEN_REQUIRED","Refresh token required");const session=await RefreshToken.findOne({where:{tokenHash:hashRefresh(token),revokedAt:null},include:[{model:User,as:"user"}]});if(!session||session.expiresAt<=new Date())throw new AppError(401,"INVALID_REFRESH_TOKEN","Invalid or expired refresh token");session.revokedAt=new Date();await session.save();const accessToken=issueAccessToken(session.user,config);await createSession(session.userId,res,config);return{user:safeUser(session.user),accessToken};}
export async function logout(token,res,config){if(token)await RefreshToken.update({revokedAt:new Date()},{where:{tokenHash:hashRefresh(token),revokedAt:null}});clearCookie(res,config);}
export async function me(id){const user=await User.findByPk(id);if(!user)throw new AppError(401,"USER_NOT_FOUND","User no longer exists");return safeUser(user);}
export {COOKIE_NAME};
