import crypto from "node:crypto";

import {
  findAll,
  findById,
  findMany,
  create,
  update,
  remove,
} from "../repositories/equipment.repository.js";

import { findAll as findAllRequests } from "../repositories/request.repository.js";

import { AppError } from "../errors/AppError.js";

const editableFields = [
  "name",
  "type",
  "serialNumber",
  "location",
  "status",
  "installedAt",
];

function pickEquipmentFields(data) {
  return Object.fromEntries(
    editableFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
}

function ensureSerialNumberIsUnique(serialNumber, currentId = null) {
  const equipment = findAll();

  const duplicate = equipment.find(
    (item) => item.serialNumber === serialNumber && item.id !== currentId,
  );

  if (duplicate) {
    throw new AppError(
      409,
      "SERIAL_NUMBER_ALREADY_EXISTS",
      `Equipment with serialNumber "${serialNumber}" already exists`,
    );
  }
}

function hasOpenRequests(equipmentId) {
  return findAllRequests().some(
    (request) =>
      request.equipmentId === equipmentId &&
      ["new", "in_progress"].includes(request.status),
  );
}

export function getAllEquipment() {
  return findAll();
}

export function getEquipmentList(query = {}) {
  const {
    type,
    status,
    location,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = query;

  const result = findMany({
    type,
    status,
    location,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return {
    data: result.items,
    meta: {
      total: result.total,
      page,
      limit,
    },
  };
}

export function getEquipmentById(id) {
  const equipment = findById(id);

  if (!equipment) {
    throw new AppError(
      404,
      "EQUIPMENT_NOT_FOUND",
      `Equipment with id "${id}" not found`,
    );
  }

  return equipment;
}

export function createEquipment(data) {
  ensureSerialNumberIsUnique(data.serialNumber);

  const now = new Date().toISOString();

  const equipment = {
    id: crypto.randomUUID(),
    ...pickEquipmentFields(data),
    createdAt: now,
    updatedAt: now,
  };

  return create(equipment);
}

export function updateEquipment(id, data) {
  const existingEquipment = getEquipmentById(id);

  const updates = pickEquipmentFields(data);

  if (updates.serialNumber !== undefined) {
    ensureSerialNumberIsUnique(updates.serialNumber, id);
  }

  return update(id, {
    ...updates,
    id: existingEquipment.id,
    createdAt: existingEquipment.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteEquipment(id) {
  getEquipmentById(id);

  if (hasOpenRequests(id)) {
    throw new AppError(
      409,
      "EQUIPMENT_HAS_OPEN_REQUESTS",
      `Equipment with id "${id}" has open maintenance requests`,
    );
  }

  remove(id);
}
