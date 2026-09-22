const REQUEST_STATUSES = ["new", "in_progress", "done", "rejected"];

const REQUEST_PRIORITIES = ["low", "medium", "high", "critical"];

const EQUIPMENT_TYPES = ["turbine", "inverter", "sensor", "substation"];

const SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "plannedAt",
  "title",
  "priority",
  "status",
];

const SORT_ORDERS = ["asc", "desc"];

function isPositiveInteger(value) {
  return /^\d+$/.test(value) && Number(value) >= 1;
}

function isValidIsoDateTime(value) {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString() === value;
}

export function validateRequestQuery(query = {}) {
  const details = [];

  if (query.status !== undefined && !REQUEST_STATUSES.includes(query.status)) {
    details.push({
      field: "status",
      reason: "must be one of: new, in_progress, done, rejected",
    });
  }

  if (
    query.priority !== undefined &&
    !REQUEST_PRIORITIES.includes(query.priority)
  ) {
    details.push({
      field: "priority",
      reason: "must be one of: low, medium, high, critical",
    });
  }

  if (query.type !== undefined && !EQUIPMENT_TYPES.includes(query.type)) {
    details.push({
      field: "type",
      reason: "must be one of: turbine, inverter, sensor, substation",
    });
  }

  if (
    query.equipmentId !== undefined &&
    (typeof query.equipmentId !== "string" || query.equipmentId.trim() === "")
  ) {
    details.push({
      field: "equipmentId",
      reason: "must be a non-empty string",
    });
  }

  if (query.page !== undefined && !isPositiveInteger(query.page)) {
    details.push({
      field: "page",
      reason: "must be a positive integer",
    });
  }

  if (query.limit !== undefined) {
    if (
      !/^\d+$/.test(query.limit) ||
      Number(query.limit) < 1 ||
      Number(query.limit) > 100
    ) {
      details.push({
        field: "limit",
        reason: "must be an integer between 1 and 100",
      });
    }
  }

  if (query.sortBy !== undefined && !SORT_FIELDS.includes(query.sortBy)) {
    details.push({
      field: "sortBy",
      reason: `must be one of: ${SORT_FIELDS.join(", ")}`,
    });
  }

  if (query.sortOrder !== undefined && !SORT_ORDERS.includes(query.sortOrder)) {
    details.push({
      field: "sortOrder",
      reason: "must be either asc or desc",
    });
  }

  if (query.dateFrom !== undefined && !isValidIsoDateTime(query.dateFrom)) {
    details.push({
      field: "dateFrom",
      reason: "must be a valid ISO date-time",
    });
  }

  if (query.dateTo !== undefined && !isValidIsoDateTime(query.dateTo)) {
    details.push({
      field: "dateTo",
      reason: "must be a valid ISO date-time",
    });
  }

  if (
    query.dateFrom !== undefined &&
    query.dateTo !== undefined &&
    isValidIsoDateTime(query.dateFrom) &&
    isValidIsoDateTime(query.dateTo) &&
    new Date(query.dateFrom) > new Date(query.dateTo)
  ) {
    details.push({
      field: "dateFrom",
      reason: "must be less than or equal to dateTo",
    });
  }

  return details;
}
