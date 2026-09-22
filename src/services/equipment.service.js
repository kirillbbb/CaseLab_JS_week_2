import crypto from 'node:crypto';

import {
  findAll,
  findById,
  findMany,
  create,
  update,
  remove,
} from '../repositories/equipment.repository.js';

import { AppError } from '../errors/AppError.js';

const editableFields = [
  'name',
  'type',
  'status',
  'location',
  'description',
];

function pickEquipmentFields(data) {
  return Object.fromEntries(
    editableFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
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
    sortBy = 'createdAt',
    sortOrder = 'desc',
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
      'EQUIPMENT_NOT_FOUND',
      `Equipment with id "${id}" not found`,
    );
  }

  return equipment;
}

export function createEquipment(data) {
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

  const updatedEquipment = {
    ...pickEquipmentFields(data),
    id: existingEquipment.id,
    createdAt: existingEquipment.createdAt,
    updatedAt: new Date().toISOString(),
  };

  return update(id, updatedEquipment);
}

export function deleteEquipment(id) {
  getEquipmentById(id);

  remove(id);
}