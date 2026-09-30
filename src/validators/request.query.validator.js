const STATUSES = ["new", "in_progress", "done", "rejected"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const TYPES = ["turbine", "inverter", "sensor", "substation"];
const SORT_FIELDS = ["createdAt", "updatedAt", "plannedAt", "title", "priority", "status"];
const isIso = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;

export function validateRequestQuery(query = {}) {
  const details = [];
  if (query.status !== undefined && !STATUSES.includes(query.status)) details.push({ field: "status", reason: `must be one of: ${STATUSES.join(", ")}` });
  if (query.priority !== undefined && !PRIORITIES.includes(query.priority)) details.push({ field: "priority", reason: `must be one of: ${PRIORITIES.join(", ")}` });
  if (query.type !== undefined && !TYPES.includes(query.type)) details.push({ field: "type", reason: `must be one of: ${TYPES.join(", ")}` });
  if (query.page !== undefined && (!/^\d+$/.test(query.page) || Number(query.page) < 1)) details.push({ field: "page", reason: "must be a positive integer" });
  if (query.limit !== undefined && (!/^\d+$/.test(query.limit) || Number(query.limit) < 1 || Number(query.limit) > 100)) details.push({ field: "limit", reason: "must be an integer between 1 and 100" });
  if (query.sortBy !== undefined && !SORT_FIELDS.includes(query.sortBy)) details.push({ field: "sortBy", reason: `must be one of: ${SORT_FIELDS.join(", ")}` });
  if (query.sortOrder !== undefined && !["asc", "desc"].includes(query.sortOrder)) details.push({ field: "sortOrder", reason: "must be either asc or desc" });
  if (query.dateFrom !== undefined && !isIso(query.dateFrom)) details.push({ field: "dateFrom", reason: "must be a valid ISO date-time" });
  if (query.dateTo !== undefined && !isIso(query.dateTo)) details.push({ field: "dateTo", reason: "must be a valid ISO date-time" });
  if (query.dateFrom && query.dateTo && isIso(query.dateFrom) && isIso(query.dateTo) && new Date(query.dateFrom) > new Date(query.dateTo)) details.push({ field: "dateFrom", reason: "must be less than or equal to dateTo" });
  return details;
}