import crypto from "node:crypto";

import { sequelize } from "../db/sequelize.js";
import * as requestRepository from "../repositories/request.repository.js";
import * as equipmentRepository from "../repositories/equipment.repository.js";
import { Technician, RequestAssignee } from "../models/index.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const editableFields = ["title", "description", "priority", "plannedAt"];
const transitions = {
  new: new Set(["in_progress", "rejected"]),
  in_progress: new Set(["done", "rejected"]),
  done: new Set(),
  rejected: new Set(),
};

function pickFields(data) {
  return Object.fromEntries(editableFields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
}

export async function getRequests(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const result = await requestRepository.findMany({ ...query, page, limit });
  return { data: result.items, meta: { total: result.total, page, limit } };
}

export async function getRequest(id) {
  const request = await requestRepository.findById(id);
  if (!request) throw new NotFoundError("REQUEST_NOT_FOUND", `Maintenance request with id "${id}" not found`);
  return request;
}

export async function getEquipmentRequests(equipmentId) {
  const equipment = await equipmentRepository.findById(equipmentId);
  if (!equipment) throw new NotFoundError("EQUIPMENT_NOT_FOUND", `Equipment with id "${equipmentId}" not found`);
  return getRequests({ equipmentId, page: 1, limit: 20 });
}

export async function createRequest(data) {
  const equipment = await equipmentRepository.findById(data.equipmentId);
  if (!equipment) throw new NotFoundError("EQUIPMENT_NOT_FOUND", `Equipment with id "${data.equipmentId}" not found`);

  return requestRepository.create({
    id: crypto.randomUUID(),
    equipmentId: data.equipmentId,
    ...pickFields(data),
    priority: data.priority ?? "medium",
    status: "new",
    author: data.author ?? "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateRequest(id, data) {
  const existing = await getRequest(id);
  return requestRepository.update(id, {
    ...pickFields(data),
    id: existing.id,
    equipmentId: existing.equipmentId,
    status: existing.status,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  });
}

export async function updateStatus(id, status, context = {}) {
  const transaction = await sequelize.transaction();
  try {
    const request = await requestRepository.findByIdForUpdate(id, { transaction });
    if (!request) throw new NotFoundError("REQUEST_NOT_FOUND", `Maintenance request with id "${id}" not found`);

    const allowed = transitions[request.status];
    if (!allowed?.has(status)) {
      throw new ConflictError("INVALID_STATUS_TRANSITION", `Cannot change request status from "${request.status}" to "${status}"`);
    }

    if (status === "in_progress") {
      const assigneeCount = await requestRepository.countAssignees(id, { transaction });
      if (assigneeCount === 0) {
        throw new ConflictError("REQUEST_HAS_NO_ASSIGNEES", "Request cannot be moved to in_progress without assigned technicians");
      }
    }

    const changedBy = context.changedBy ?? "system";
    await requestRepository.update(id, { status, updatedAt: new Date() }, { transaction });
    await requestRepository.createHistory({
      id: crypto.randomUUID(),
      requestId: id,
      fromStatus: request.status,
      toStatus: status,
      changedBy,
      comment: context.comment ?? null,
      changedAt: new Date(),
    }, { transaction });

    await transaction.commit();
    return getRequest(id);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

export async function deleteRequest(id) {
  await getRequest(id);
  await requestRepository.remove(id);
}

export async function assignTeam(id, assignees) {
  if (!Array.isArray(assignees)) {
    throw new ValidationError("Invalid assignees", [{ field: "assignees", reason: "must be an array" }]);
  }

  const invalid = assignees.find(
    (item) =>
      !item ||
      typeof item.technicianId !== "string" ||
      !["lead", "member"].includes(item.role) ||
      item.hours !== undefined &&
        (!Number.isFinite(Number(item.hours)) || Number(item.hours) < 0),
  );
  if (invalid) {
    throw new ValidationError("Invalid assignees", [{
      field: "assignees",
      reason: "each item must contain technicianId, role (lead/member) and non-negative hours",
    }]);
  }

  const leads = assignees.filter((item) => item.role === "lead").length;
  if (leads !== 1) {
    throw new ValidationError("A request must have exactly one lead technician", [{ field: "assignees", reason: "must contain exactly one lead" }]);
  }

  const ids = assignees.map((item) => item.technicianId);
  if (new Set(ids).size !== ids.length) {
    throw new ConflictError("DUPLICATE_ASSIGNEE", "The same technician cannot be assigned twice to one request");
  }

  const transaction = await sequelize.transaction();
  try {
    const request = await requestRepository.findByIdForUpdate(id, { transaction });
    if (!request) throw new NotFoundError("REQUEST_NOT_FOUND", `Maintenance request with id "${id}" not found`);

    const technicians = await Technician.findAll({
      where: { id: ids },
      attributes: ["id"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (technicians.length !== ids.length) {
      throw new NotFoundError("TECHNICIAN_NOT_FOUND", "One or more technicians were not found");
    }

    await requestRepository.replaceAssignees(id, assignees.map((item) => ({
      technicianId: item.technicianId,
      role: item.role,
      hours: item.hours ?? 0,
    })), { transaction });

    await transaction.commit();
    return getRequest(id);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

export async function removeAssignee(id, technicianId) {
  const request = await getRequest(id);
  const transaction = await sequelize.transaction();
  try {
    const assignment = await RequestAssignee.findOne({
      where: { requestId: request.id, technicianId },
      transaction,
    });
    if (!assignment) throw new NotFoundError("ASSIGNEE_NOT_FOUND", "Technician is not assigned to this request");

    const removed = await RequestAssignee.destroy({
      where: { requestId: request.id, technicianId },
      transaction,
    });
    if (!removed) throw new NotFoundError("ASSIGNEE_NOT_FOUND", "Technician is not assigned to this request");

    const remainingRows = await RequestAssignee.findAll({
      where: { requestId: request.id },
      attributes: ["role"],
      transaction,
    });
    const remainingLeads = remainingRows.filter((row) => row.role === "lead").length;
    if (remainingLeads !== 1) {
      throw new ValidationError("A request must have exactly one lead technician", [{
        field: "assignees",
        reason: "removing this technician would leave the request without exactly one lead",
      }]);
    }
    if (request.status === "in_progress" && remainingRows.length === 0) {
      throw new ConflictError("REQUEST_HAS_NO_ASSIGNEES", "An in_progress request must have at least one assigned technician");
    }

    await transaction.commit();
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

export async function getHistory(id) {
  await getRequest(id);
  const rows = await requestRepository.findHistory(id);
  return { data: rows.map((row) => row.toJSON()) };
}