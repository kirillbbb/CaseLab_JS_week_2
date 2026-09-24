const priorities = new Set(["low", "medium", "high", "critical"]);

const statuses = new Set(["new", "in_progress", "done", "rejected"]);

export function validateBody(body, { partial = false } = {}) {
  const details = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [
      {
        field: "body",
        reason: "must be a JSON object",
      },
    ];
  }

  if (!partial && body.equipmentId === undefined) {
    details.push({
      field: "equipmentId",
      reason: "is required",
    });
  }

  if (!partial && body.title === undefined) {
    details.push({
      field: "title",
      reason: "is required",
    });
  }

  if (
    body.equipmentId !== undefined &&
    (typeof body.equipmentId !== "string" || body.equipmentId.trim() === "")
  ) {
    details.push({
      field: "equipmentId",
      reason: "must be a non-empty string",
    });
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      details.push({
        field: "title",
        reason: "must be a string",
      });
    } else if (body.title.trim().length < 5) {
      details.push({
        field: "title",
        reason: "must contain at least 5 characters",
      });
    } else if (body.title.trim().length > 120) {
      details.push({
        field: "title",
        reason: "must contain at most 120 characters",
      });
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      details.push({
        field: "description",
        reason: "must be a string",
      });
    } else if (body.description.length > 2000) {
      details.push({
        field: "description",
        reason: "must contain at most 2000 characters",
      });
    }
  }

  if (body.priority !== undefined && !priorities.has(body.priority)) {
    details.push({
      field: "priority",
      reason: "must be one of: low, medium, high, critical",
    });
  }

  if (body.plannedAt !== undefined) {
    if (
      typeof body.plannedAt !== "string" ||
      Number.isNaN(Date.parse(body.plannedAt))
    ) {
      details.push({
        field: "plannedAt",
        reason: "must be a valid ISO date-time",
      });
    }
  }

  return details;
}

export function validateStatus(status) {
  if (!statuses.has(status)) {
    return [
      {
        field: "status",
        reason: "must be one of: new, in_progress, done, rejected",
      },
    ];
  }

  return [];
}
