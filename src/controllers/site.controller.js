import { sequelize, Site } from "../models/index.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export async function summary(req, res, next) {
  try {
    const site = await Site.findByPk(req.params.id, { attributes: ["id", "name", "code", "region", "latitude", "longitude"] });
    if (!site) throw new NotFoundError("SITE_NOT_FOUND", `Site with id "${req.params.id}" not found`);

    const siteData = site.toJSON();
    siteData.latitude = Number(siteData.latitude);
    siteData.longitude = Number(siteData.longitude);

    const [rows] = await sequelize.query(`
      SELECT
        COUNT(r.id)::int AS total,
        COUNT(r.id) FILTER (WHERE r.status = 'new')::int AS new,
        COUNT(r.id) FILTER (WHERE r.status = 'in_progress')::int AS in_progress,
        COUNT(r.id) FILTER (WHERE r.status = 'done')::int AS done,
        COUNT(r.id) FILTER (WHERE r.status = 'rejected')::int AS rejected,
        COUNT(r.id) FILTER (WHERE r.priority = 'low')::int AS low,
        COUNT(r.id) FILTER (WHERE r.priority = 'medium')::int AS medium,
        COUNT(r.id) FILTER (WHERE r.priority = 'high')::int AS high,
        COUNT(r.id) FILTER (WHERE r.priority = 'critical')::int AS critical,
        AVG(EXTRACT(EPOCH FROM (h.changed_at - r.created_at))) FILTER (WHERE h.to_status = 'done') AS average_closing_seconds
      FROM maintenance_requests r
      JOIN equipment e ON e.id = r.equipment_id
      LEFT JOIN request_status_history h ON h.request_id = r.id AND h.to_status = 'done'
      WHERE e.site_id = :siteId
    `, { replacements: { siteId: req.params.id } });

    const row = rows[0];
    res.status(200).json({
      data: {
        site: siteData,
        requests: {
          total: Number(row.total),
          byStatus: {
            new: Number(row.new), in_progress: Number(row.in_progress),
            done: Number(row.done), rejected: Number(row.rejected),
          },
          byPriority: {
            low: Number(row.low), medium: Number(row.medium),
            high: Number(row.high), critical: Number(row.critical),
          },
        },
        averageClosingTimeSeconds: row.average_closing_seconds === null ? null : Number(row.average_closing_seconds),
      },
    });
  } catch (e) { next(e); }
}