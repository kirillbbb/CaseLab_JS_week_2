import { sequelize } from "../db/sequelize.js";
import { BadRequestError } from "../errors/BadRequestError.js";

const SORT_FIELDS = {
  requestCount: '"requestCount"',
  closedCount: '"closedCount"',
  plannedHours: '"plannedHours"',
  lastMaintenanceAt: '"lastMaintenanceAt"', 
};

function validate(query) {
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestError("Invalid report pagination", [{ field: "limit", reason: "must be an integer between 1 and 100" }]);
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new BadRequestError("Invalid report pagination", [{ field: "offset", reason: "must be an integer between 0 and 10000" }]);
  if (query.sortBy && !SORT_FIELDS[query.sortBy]) throw new BadRequestError("Invalid report sorting", [{ field: "sortBy", reason: `must be one of: ${Object.keys(SORT_FIELDS).join(", ")}` }]);
  if (query.sortOrder && !["asc", "desc"].includes(query.sortOrder)) throw new BadRequestError("Invalid report sorting", [{ field: "sortOrder", reason: "must be asc or desc" }]);
  if (query.minRequests !== undefined && (!/^\d+$/.test(query.minRequests) || Number(query.minRequests) < 0)) throw new BadRequestError("Invalid minRequests", [{ field: "minRequests", reason: "must be a non-negative integer" }]);
  if (query.dateFrom && Number.isNaN(Date.parse(query.dateFrom))) throw new BadRequestError("Invalid dateFrom", [{ field: "dateFrom", reason: "must be a valid date" }]);
  if (query.dateTo && Number.isNaN(Date.parse(query.dateTo))) throw new BadRequestError("Invalid dateTo", [{ field: "dateTo", reason: "must be a valid date" }]);
  if (query.dateFrom && query.dateTo && new Date(query.dateFrom) > new Date(query.dateTo)) throw new BadRequestError("Invalid period", [{ field: "dateFrom", reason: "must be less than or equal to dateTo" }]);
  return { limit, offset };
}

export async function equipmentLoad(req, res, next) {
  try {
    const { limit, offset } = validate(req.query);
    const orderBy = SORT_FIELDS[req.query.sortBy ?? "requestCount"];
    const order = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    const sql = `
      WITH filtered_requests AS (
        SELECT r.id, r.equipment_id, r.status
        FROM maintenance_requests r
        WHERE (:dateFrom IS NULL OR r.created_at >= :dateFrom)
          AND (:dateTo IS NULL OR r.created_at <= :dateTo)
      ),
      hours_by_request AS (
        SELECT ra.request_id, SUM(ra.hours) AS planned_hours
        FROM request_assignees ra
        GROUP BY ra.request_id
      ),
      maintenance AS (
        SELECT request_id, MAX(changed_at) AS last_maintenance_at
        FROM request_status_history
        WHERE to_status = 'done'
        GROUP BY request_id
      )
      SELECT
        e.id,
        e.name,
        e.type,
        e.serial_number AS "serialNumber",
        COUNT(fr.id)::int AS "requestCount",
        COUNT(fr.id) FILTER (WHERE fr.status = 'done')::int AS "closedCount",
        COALESCE(SUM(hbr.planned_hours), 0)::numeric AS "plannedHours",
        MAX(m.last_maintenance_at) AS "lastMaintenanceAt"
      FROM equipment e
      LEFT JOIN filtered_requests fr ON fr.equipment_id = e.id
      LEFT JOIN hours_by_request hbr ON hbr.request_id = fr.id
      LEFT JOIN maintenance m ON m.request_id = fr.id
      GROUP BY e.id, e.name, e.type, e.serial_number
      HAVING COUNT(fr.id) >= :minRequests
      ORDER BY ${orderBy} ${order}, e.id ASC
      LIMIT :limit OFFSET :offset
    `;

    const [rows] = await sequelize.query(sql, {
      replacements: {
        dateFrom: req.query.dateFrom ?? null,
        dateTo: req.query.dateTo ?? null,
        minRequests: Number(req.query.minRequests ?? 0),
        limit, offset,
      },
    });
    res.status(200).json({ data: rows, meta: { limit, offset } });
  } catch (e) { next(e); }
}