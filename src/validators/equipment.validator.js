const TYPES = ["turbine", "inverter", "sensor", "substation"];
const STATUSES = ["operational", "maintenance", "fault", "decommissioned"];

function isoDate(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function validateEquipmentBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [{ field: "body", reason: "must be a JSON object" }];
  const details = [];
  for (const field of ["name", "type", "serialNumber", "location", "status", "installedAt"]) {
    if (!partial && body[field] === undefined) details.push({ field, reason: "is required" });
  }
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 3 || body.name.trim().length > 100)) details.push({ field: "name", reason: "must contain between 3 and 100 characters" });
  if (body.type !== undefined && !TYPES.includes(body.type)) details.push({ field: "type", reason: `must be one of: ${TYPES.join(", ")}` });
  if (body.serialNumber !== undefined && (typeof body.serialNumber !== "string" || !body.serialNumber.trim())) details.push({ field: "serialNumber", reason: "must be a non-empty string" });
  if (body.location !== undefined && (!body.location || typeof body.location !== "object" || Array.isArray(body.location) || typeof body.location.lat !== "number" || typeof body.location.lon !== "number" || body.location.lat < -90 || body.location.lat > 90 || body.location.lon < -180 || body.location.lon > 180)) details.push({ field: "location", reason: "must contain numeric lat/lon in valid ranges" });
  if (body.status !== undefined && !STATUSES.includes(body.status)) details.push({ field: "status", reason: `must be one of: ${STATUSES.join(", ")}` });
  if (body.installedAt !== undefined && (!isoDate(body.installedAt) || new Date(body.installedAt) > new Date())) details.push({ field: "installedAt", reason: "must be a valid ISO date not in the future" });
  if (body.siteId !== undefined && (typeof body.siteId !== "string" || !body.siteId.trim())) details.push({ field: "siteId", reason: "must be a non-empty UUID string" });
  return details;
}