import { ValidationError } from "../errors/ValidationError.js";
const allowed = new Set(["name", "type", "status", "location", "createdAt", "updatedAt"]);
export function validateEquipmentQuery(req, _res, next) {
  const { page, limit, sortBy, sortOrder, type, status } = req.query;
  const details = [];
  const types = ["turbine", "inverter", "sensor", "substation"];
  const statuses = ["operational", "maintenance", "fault", "decommissioned"];
  if (type !== undefined && !types.includes(type)) details.push({ field: "type", reason: `must be one of: ${types.join(", ")}` });
  if (status !== undefined && !statuses.includes(status)) details.push({ field: "status", reason: `must be one of: ${statuses.join(", ")}` });
  if (page !== undefined && (!/^\d+$/.test(page) || Number(page) < 1)) details.push({ field: "page", reason: "must be a positive integer" });
  if (limit !== undefined && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)) details.push({ field: "limit", reason: "must be an integer between 1 and 100" });
  if (sortBy !== undefined && !allowed.has(sortBy)) details.push({ field: "sortBy", reason: `must be one of: ${[...allowed].join(", ")}` });
  if (sortOrder !== undefined && !["asc", "desc"].includes(sortOrder)) details.push({ field: "sortOrder", reason: "must be either asc or desc" });
  if (details.length) throw new ValidationError("Invalid query parameters", details);
  next();
}