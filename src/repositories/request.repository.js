import { Op } from "sequelize";

import {
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestAssignee,
  RequestStatusHistory,
  Site,
  Technician,
} from "../models/index.js";

const REQUEST_SORT_FIELDS = {
  createdAt: ["createdAt"],
  updatedAt: ["updatedAt"],
  plannedAt: ["plannedAt"],
  title: ["title"],
  priority: ["priority"],
  status: ["status"],
};

const equipmentAttributes = ["id", "siteId", "name", "type", "serialNumber", "status", "installedAt"];
const siteAttributes = ["id", "name", "code", "region", "latitude", "longitude"];
const passportAttributes = ["id", "manufacturer", "model", "ratedPower", "lastCalibrationAt"];
const technicianAttributes = ["id", "fullName", "specialization", "employeeNumber"];

const requestAttributes = [
  "id", "equipmentId", "title", "description", "priority", "status", "plannedAt", "author", "createdAt", "updatedAt",
];

function mapEquipment(json) {
  if (!json) return null;
  return {
    id: json.id,
    name: json.name,
    type: json.type,
    serialNumber: json.serialNumber,
    location: json.site ? { lat: Number(json.site.latitude), lon: Number(json.site.longitude) } : null,
    status: json.status,
    installedAt: new Date(json.installedAt).toISOString(),
    createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt).toISOString() : undefined,
    ...(json.passport ? {
      passport: {
        ...json.passport,
        ratedPower: Number(json.passport.ratedPower),
        lastCalibrationAt: json.passport.lastCalibrationAt ? new Date(json.passport.lastCalibrationAt).toISOString() : null,
      },
    } : {}),
  };
}

function mapAssignees(json) {
  return (json.technicians ?? []).map((technician) => ({
    id: technician.id,
    fullName: technician.fullName,
    specialization: technician.specialization,
    employeeNumber: technician.employeeNumber,
    role: technician.RequestAssignee.role,
    hours: Number(technician.RequestAssignee.hours),
  }));
}

function toRequest(row) {
  const json = row.toJSON();
  return {
    id: json.id,
    equipmentId: json.equipmentId,
    title: json.title,
    description: json.description,
    priority: json.priority,
    status: json.status,
    plannedAt: json.plannedAt ? new Date(json.plannedAt).toISOString() : null,
    author: json.author,
    createdAt: new Date(json.createdAt).toISOString(),
    updatedAt: new Date(json.updatedAt).toISOString(),
    ...(json.equipment ? { equipment: mapEquipment(json.equipment) } : {}),
    assignees: mapAssignees(json),
  };
}

const baseIncludes = [
  {
    model: Equipment,
    as: "equipment",
    attributes: equipmentAttributes,
    required: true,
    include: [
      { model: Site, as: "site", attributes: siteAttributes, required: true },
      { model: EquipmentPassport, as: "passport", attributes: passportAttributes, required: false },
    ],
  },
  {
    model: Technician,
    as: "technicians",
    attributes: technicianAttributes,
    through: { attributes: ["role", "hours"] },
    required: false,
  },
];

export async function findById(id, options = {}) {
  const row = await MaintenanceRequest.findByPk(id, {
    ...options,
    attributes: requestAttributes,
    include: baseIncludes,
  });
  return row ? toRequest(row) : null;
}

export async function findByIdForUpdate(id, options = {}) {
  const row = await MaintenanceRequest.findByPk(id, {
    ...options,
    attributes: requestAttributes,
    include: baseIncludes,
    lock: options.transaction
      ? { level: options.transaction.LOCK.UPDATE, of: MaintenanceRequest }
      : undefined,
  });
  return row ? toRequest(row) : null;
}

export async function findMany({
  status, priority, equipmentId, type, dateFrom, dateTo, sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 20,
}) {
  const where = {};
  if (status !== undefined) where.status = status;
  if (priority !== undefined) where.priority = priority;
  if (equipmentId !== undefined) where.equipmentId = equipmentId;
  if (dateFrom !== undefined || dateTo !== undefined) {
    where.createdAt = {};
    if (dateFrom !== undefined) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo !== undefined) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const equipmentWhere = type !== undefined ? { type } : undefined;
  const include = baseIncludes.map((item) => ({ ...item }));
  include[0] = { ...include[0], where: equipmentWhere, required: true };

  const orderField = REQUEST_SORT_FIELDS[sortBy] ?? REQUEST_SORT_FIELDS.createdAt;
  const result = await MaintenanceRequest.findAndCountAll({
    where,
    attributes: requestAttributes,
    include,
    order: [[...orderField, sortOrder.toUpperCase()], ["id", "ASC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return { items: result.rows.map(toRequest), total: result.count };
}

export async function create(data, options = {}) {
  const row = await MaintenanceRequest.create(data, options);
  return findById(row.id, options);
}

export async function update(id, data, options = {}) {
  await MaintenanceRequest.update(data, { where: { id }, ...options });
  return findById(id, options);
}

export async function remove(id, options = {}) {
  return MaintenanceRequest.destroy({ where: { id }, ...options });
}

export async function countAssignees(requestId, options = {}) {
  return RequestAssignee.count({ where: { requestId }, ...options });
}

export async function replaceAssignees(requestId, assignees, options = {}) {
  await RequestAssignee.destroy({ where: { requestId }, ...options });
  if (assignees.length > 0) {
    await RequestAssignee.bulkCreate(assignees.map((item) => ({ requestId, ...item })), options);
  }
}

export async function findAssignees(requestId, options = {}) {
  const rows = await RequestAssignee.findAll({
    where: { requestId },
    include: [{ model: Technician, as: "technician", attributes: technicianAttributes }],
    ...options,
  });
  return rows.map((row) => ({
    technicianId: row.technicianId,
    fullName: row.technician.fullName,
    specialization: row.technician.specialization,
    employeeNumber: row.technician.employeeNumber,
    role: row.role,
    hours: Number(row.hours),
  }));
}

export async function findHistory(requestId, options = {}) {
  return RequestStatusHistory.findAll({
    where: { requestId },
    attributes: ["id", "fromStatus", "toStatus", "changedBy", "comment", "changedAt"],
    order: [["changedAt", "ASC"], ["id", "ASC"]],
    ...options,
  });
}

export async function createHistory(data, options = {}) {
  return RequestStatusHistory.create(data, options);
}