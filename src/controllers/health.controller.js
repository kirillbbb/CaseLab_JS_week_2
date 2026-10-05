import { sequelize } from "../db/sequelize.js";

export async function live(_req, res) { res.status(200).json({ status: "ok" }); }

export async function ready(_req, res) {
  try { await sequelize.authenticate(); res.status(200).json({ status: "ok", database: "ok" }); }
  catch { res.status(503).json({ status: "unavailable", database: "unavailable" }); }
}
