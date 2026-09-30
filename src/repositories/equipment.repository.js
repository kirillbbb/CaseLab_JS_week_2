import { Op } from "sequelize";

import { Equipment, EquipmentPassport, Site } from "../models/index.js";

const EQUIPMENT_SORT_FIELDS = {
  name: ["name"],
  type: ["type"],
  status: ["status"],
  createdAt: ["createdAt"],
  updatedAt: ["updatedAt"],
  installedAt: ["installedAt"],
};

const siteAttributes = ["id", "name", "code", "region", "latitude", "longitude"];
const passportAttributes = ["id", "manufacturer", "model", "ratedPower", "lastCalibrationAt"];

const equipmentAttributes = [
  "id", "siteId", "name", "type", "serialNumber", "status", "installedAt", "createdAt", "updatedAt",
];

function mapPassport(passport) {
  if (!passport) return null;
  return {
    id: passport.id,
    manufacturer: passport.manufacturer,
    model: passport.model,
    ratedPower: Number(passport.ratedPower),
    lastCalibrationAt: passport.lastCalibrationAt ? new Date(passport.lastCalibrationAt).toISOString() : null,
  };
}

const toEquipment = (item) => {
  const json = item.toJSON();
  const site = json.site;
  return {
    id: json.id,
    name: json.name,
    type: json.type,
    serialNumber: json.serialNumber,
    location: site ? { lat: Number(site.latitude), lon: Number(site.longitude) } : null,
    status: json.status,
    installedAt: new Date(json.installedAt).toISOString(),
    createdAt: new Date(json.createdAt).toISOString(),
    updatedAt: new Date(json.updatedAt).toISOString(),
    ...(json.passport ? { passport: mapPassport(json.passport) } : {}),
  };
};

const baseInclude = [
  { model: Site, as: "site", attributes: siteAttributes, required: true },
  { model: EquipmentPassport, as: "passport", attributes: passportAttributes, required: false },
];

export async function findAll(options = {}) {
  const rows = await Equipment.findAll({
    ...options,
    attributes: equipmentAttributes,
    include: baseInclude,
    order: [["createdAt", "DESC"], ["id", "ASC"]],
  });
  return rows.map(toEquipment);
}

export async function findById(id, options = {}) {
  const row = await Equipment.findByPk(id, {
    ...options,
    attributes: equipmentAttributes,
    include: baseInclude,
  });
  return row ? toEquipment(row) : null;
}

export async function findByIdRaw(id, options = {}) {
  return Equipment.findByPk(id, { ...options, attributes: equipmentAttributes });
}

export async function findMany({ type, status, location, sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 20 }) {
  const where = {};
  if (type !== undefined) where.type = type;
  if (status !== undefined) where.status = status;
  if (location?.lat !== undefined && location?.lon !== undefined) {
    const site = await Site.findOne({
      where: { latitude: location.lat, longitude: location.lon },
      attributes: ["id"],
    });
    if (!site) return { items: [], total: 0 };
    where.siteId = site.id;
  }

  const orderField = EQUIPMENT_SORT_FIELDS[sortBy] ?? EQUIPMENT_SORT_FIELDS.createdAt;
  const result = await Equipment.findAndCountAll({
    where,
    attributes: equipmentAttributes,
    include: baseInclude,
    order: [[...orderField, sortOrder.toUpperCase()], ["id", "ASC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return { items: result.rows.map(toEquipment), total: result.count };
}

export async function findBySerialNumber(serialNumber, options = {}) {
  return Equipment.findOne({ where: { serialNumber }, attributes: ["id", "serialNumber"], ...options });
}

export async function findSiteByLocation(latitude, longitude, options = {}) {
  return Site.findOne({ where: { latitude, longitude }, attributes: ["id"], ...options });
}

export async function create(data, options = {}) {
  const row = await Equipment.create(data, options);
  return findById(row.id, options);
}

export async function update(id, updates, options = {}) {
  await Equipment.update(updates, { where: { id }, ...options });
  return findById(id, options);
}

export async function remove(id, options = {}) {
  return Equipment.destroy({ where: { id }, ...options });
}

export async function hasRequests(id) {
  const { MaintenanceRequest } = await import("../models/index.js");
  return (await MaintenanceRequest.count({ where: { equipmentId: id } })) > 0;
}

export async function hasOpenRequests(id) {
  const { MaintenanceRequest } = await import("../models/index.js");
  const count = await MaintenanceRequest.count({
    where: { equipmentId: id, status: { [Op.in]: ["new", "in_progress"] } },
  });
  return count > 0;
}