const PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const STATUSES = new Set(["new", "in_progress", "done", "rejected"]);

export function validateBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [{ field: "body", reason: "must be a JSON object" }];
  const details = [];
  if (!partial && body.equipmentId === undefined) details.push({ field: "equipmentId", reason: "is required" });
  if (!partial && body.title === undefined) details.push({ field: "title", reason: "is required" });
  if (body.equipmentId !== undefined && (typeof body.equipmentId !== "string" || !body.equipmentId.trim())) details.push({ field: "equipmentId", reason: "must be a non-empty string" });
  if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length < 5 || body.title.trim().length > 120)) details.push({ field: "title", reason: "must contain between 5 and 120 characters" });
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 2000)) details.push({ field: "description", reason: "must be a string with at most 2000 characters" });
  if (body.priority !== undefined && !PRIORITIES.has(body.priority)) details.push({ field: "priority", reason: "must be one of: low, medium, high, critical" });
  if (body.plannedAt !== undefined && (typeof body.plannedAt !== "string" || Number.isNaN(Date.parse(body.plannedAt)))) details.push({ field: "plannedAt", reason: "must be a valid ISO date-time" });
  if (body.author !== undefined && (typeof body.author !== "string" || body.author.trim() === "")) details.push({ field: "author", reason: "must be a non-empty string" });
  return details;
}
export function validateStatus(status) {
  return STATUSES.has(status) ? [] : [{ field: "status", reason: "must be one of: new, in_progress, done, rejected" }];
}