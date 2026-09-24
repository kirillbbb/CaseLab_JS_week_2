import crypto from "node:crypto";

import {
  findById,
  findMany,
  create,
  update,
  remove,
} from "../repositories/request.repository.js";

import * as equipmentRepository from "../repositories/equipment.repository.js";

import { AppError } from "../errors/AppError.js";

const editableFields = ["title", "description", "priority", "plannedAt"];

const transitions = {
  new: new Set(["in_progress", "rejected"]),
  in_progress: new Set(["done", "rejected"]),
  done: new Set(),
  rejected: new Set(),
};

function pickFields(data) {
  return Object.fromEntries(
    editableFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
}

function getEquipment(equipmentId) {
  const equipment = equipmentRepository.findById(equipmentId);

  if (!equipment) {
    throw new AppError(
      404,
      "EQUIPMENT_NOT_FOUND",
      `Equipment with id "${equipmentId}" not found`,
    );
  }

  return equipment;
}

export function getRequests(query = {}) {
  const result = findMany({
    ...query,
    equipmentRepository,
  });

  return {
    data: result.items,
    meta: {
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  };
}

export function getRequest(id) {
  const request = findById(id);

  if (!request) {
    throw new AppError(
      404,
      "REQUEST_NOT_FOUND",
      `Maintenance request with id "${id}" not found`,
    );
  }

  return request;
}

export function getEquipmentRequests(equipmentId) {
  getEquipment(equipmentId);

  return getRequests({
    equipmentId,
    page: 1,
    limit: 20,
  });
}

export function createRequest(data) {
  getEquipment(data.equipmentId);

  const now = new Date().toISOString();

  const request = {
    id: crypto.randomUUID(),
    equipmentId: data.equipmentId,
    ...pickFields(data),
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  return create(request);
}

export function updateRequest(id, data) {
  const existing = getRequest(id);

  return update(id, {
    ...pickFields(data),
    id: existing.id,
    equipmentId: existing.equipmentId,
    status: existing.status,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export function updateStatus(id, status) {
  const request = getRequest(id);
  const allowed = transitions[request.status];

  if (!allowed?.has(status)) {
    throw new AppError(
      409,
      "INVALID_STATUS_TRANSITION",
      `Cannot change request status from "${request.status}" to "${status}"`,
    );
  }

  return update(id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteRequest(id) {
  getRequest(id);
  remove(id);
}
