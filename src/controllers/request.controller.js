import {
  getRequests,
  getRequest,
  getEquipmentRequests,
  createRequest,
  updateRequest,
  updateStatus,
  deleteRequest,
} from "../services/request.service.js";

export function list(req, res) {
  const result = getRequests(req.query);

  res.status(200).json(result);
}

export function get(req, res) {
  const request = getRequest(req.params.id);

  res.status(200).json({
    data: request,
  });
}

export function getByEquipment(req, res) {
  const result = getEquipmentRequests(req.params.equipmentId);

  res.status(200).json(result);
}

export function create(req, res) {
  const request = createRequest(req.body);

  res.status(201).location(`/api/requests/${request.id}`).json({
    data: request,
  });
}

export function update(req, res) {
  const request = updateRequest(req.params.id, req.body);

  res.status(200).json({
    data: request,
  });
}

export function changeStatus(req, res) {
  const request = updateStatus(req.params.id, req.body.status);

  res.status(200).json({
    data: request,
  });
}

export function remove(req, res) {
  deleteRequest(req.params.id);

  res.status(204).send();
}
