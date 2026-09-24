const EQUIPMENT_TYPES = ["turbine", "inverter", "sensor", "substation"];

const EQUIPMENT_STATUSES = [
  "operational",
  "maintenance",
  "fault",
  "decommissioned",
];

const requiredFields = [
  "name",
  "type",
  "serialNumber",
  "location",
  "status",
  "installedAt",
];

function isValidIsoDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString() === value;
}

function isLocationValid(location) {
  if (!location || typeof location !== "object" || Array.isArray(location)) {
    return false;
  }

  return (
    typeof location.lat === "number" &&
    Number.isFinite(location.lat) &&
    typeof location.lon === "number" &&
    Number.isFinite(location.lon)
  );
}

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

  if (!partial) {
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        details.push({
          field,
          reason: "is required",
        });
      }
    }
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      details.push({
        field: "name",
        reason: "must be a string",
      });
    } else {
      const name = body.name.trim();

      if (name.length < 3 || name.length > 100) {
        details.push({
          field: "name",
          reason: "must contain between 3 and 100 characters",
        });
      }
    }
  }

  if (body.type !== undefined && !EQUIPMENT_TYPES.includes(body.type)) {
    details.push({
      field: "type",
      reason: `must be one of: ${EQUIPMENT_TYPES.join(", ")}`,
    });
  }

  if (body.serialNumber !== undefined) {
    if (
      typeof body.serialNumber !== "string" ||
      body.serialNumber.trim() === ""
    ) {
      details.push({
        field: "serialNumber",
        reason: "must be a non-empty string",
      });
    }
  }

  if (body.location !== undefined && !isLocationValid(body.location)) {
    details.push({
      field: "location",
      reason: "must contain numeric lat and lon",
    });
  }

  if (body.status !== undefined && !EQUIPMENT_STATUSES.includes(body.status)) {
    details.push({
      field: "status",
      reason: `must be one of: ${EQUIPMENT_STATUSES.join(", ")}`,
    });
  }

  if (body.installedAt !== undefined) {
    if (!isValidIsoDate(body.installedAt)) {
      details.push({
        field: "installedAt",
        reason: "must be a valid ISO date",
      });
    } else if (new Date(body.installedAt) > new Date()) {
      details.push({
        field: "installedAt",
        reason: "must not be in the future",
      });
    }
  }

  return details;
}
