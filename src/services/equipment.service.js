import crypto from "node:crypto";

import * as equipmentRepository from "../repositories/equipment.repository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

const editableFields = ["name", "type", "serialNumber", "status", "installedAt"];

function pickFields(data) {
  return Object.fromEntries(editableFields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
}

export async function getAllEquipment() {
  return equipmentRepository.findAll();
}

export async function getEquipmentList(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const location = query.location ? parseLocation(query.location) : undefined;
  const result = await equipmentRepository.findMany({
    ...query, page, limit, location,
  });
  return { data: result.items, meta: { total: result.total, page, limit } };
}

function parseLocation(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export async function getEquipmentById(id) {
  const equipment = await equipmentRepository.findById(id);
  if (!equipment) throw new NotFoundError("EQUIPMENT_NOT_FOUND", `Equipment with id "${id}" not found`);
  return equipment;
}

export async function createEquipment(data) {
  const duplicate = await equipmentRepository.findBySerialNumber?.(data.serialNumber);
  if (duplicate) throw new ConflictError("SERIAL_NUMBER_ALREADY_EXISTS", `Equipment with serialNumber "${data.serialNumber}" already exists`);

  let siteId = data.siteId;
  if (!siteId && data.location) {
    const site = await equipmentRepository.findSiteByLocation(data.location.lat, data.location.lon);
    siteId = site?.id;
  }
  if (!siteId) {
    throw new ConflictError("SITE_REQUIRED", "siteId is required or location must match an existing site");
  }

  const now = new Date();
  return equipmentRepository.create({
    id: crypto.randomUUID(),
    siteId,
    name: data.name,
    type: data.type,
    serialNumber: data.serialNumber,
    status: data.status,
    installedAt: data.installedAt,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateEquipment(id, data) {
  const existing = await getEquipmentById(id);
  let siteId = data.siteId;
  if (data.location) {
    const site = await equipmentRepository.findSiteByLocation(data.location.lat, data.location.lon);
    if (!site) {
      throw new ConflictError("SITE_NOT_FOUND", "location must match an existing site");
    }
    siteId = site.id;
  }
  if (siteId !== undefined) {
    const fields = pickFields(data);
    return equipmentRepository.update(id, { ...fields, siteId, updatedAt: new Date(), id: existing.id });
  }

  return equipmentRepository.update(id, {
    ...pickFields(data),
    updatedAt: new Date(),
    id: existing.id,
  });
}

export async function deleteEquipment(id) {
  await getEquipmentById(id);
  if (await equipmentRepository.hasRequests(id)) {
    throw new ConflictError("EQUIPMENT_HAS_OPEN_REQUESTS", `Equipment with id "${id}" has maintenance requests and cannot be deleted`);
  }
  await equipmentRepository.remove(id);
}