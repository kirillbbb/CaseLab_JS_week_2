const allowedFields = new Set([
  "name",
  "type",
  "status",
  "location",
  "description",
]);

const requiredFields = ["name", "type", "location"];

export function validateEquipmentBody(body, { partial = false } = {}) {
  const details = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [
      {
        field: "body",
        reason: "must be a JSON object",
      },
    ];
  }

  for (const field of requiredFields) {
    if (partial) {
      continue;
    }

    if (body[field] === undefined) {
      details.push({
        field,
        reason: "is required and must be a non-empty string",
      });
    }
  }

  for (const [field, value] of Object.entries(body)) {
    if (!allowedFields.has(field)) {
      continue;
    }

    if (typeof value !== "string" || value.trim() === "") {
      details.push({
        field,
        reason: "must be a non-empty string",
      });
    }
  }

  return details;
}
