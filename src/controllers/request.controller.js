import * as requestService from "../services/request.service.js";

export async function list(req, res, next) {
  try { res.status(200).json(await requestService.getRequests(req.query)); } catch (e) { next(e); }
}
export async function get(req, res, next) {
  try { res.status(200).json({ data: await requestService.getRequest(req.params.id) }); } catch (e) { next(e); }
}
export async function getByEquipment(req, res, next) {
  try { res.status(200).json(await requestService.getEquipmentRequests(req.params.equipmentId)); } catch (e) { next(e); }
}
export async function create(req, res, next) {
  try {
    const request = await requestService.createRequest(req.body);
    res.status(201).location(`/api/requests/${request.id}`).json({ data: request });
  } catch (e) { next(e); }
}
export async function update(req, res, next) {
  try { res.status(200).json({ data: await requestService.updateRequest(req.params.id, req.body) }); } catch (e) { next(e); }
}
export async function changeStatus(req, res, next) {
  try {
    const request = await requestService.updateStatus(req.params.id, req.body.status, { changedBy: req.body.changedBy, comment: req.body.comment });
    res.status(200).json({ data: request });
  } catch (e) { next(e); }
}
export async function remove(req, res, next) {
  try { await requestService.deleteRequest(req.params.id); res.status(204).send(); } catch (e) { next(e); }
}
export async function assignTeam(req, res, next) {
  try {
    const request = await requestService.assignTeam(req.params.id, req.body.assignees);
    res.status(200).json({ data: request });
  } catch (e) { next(e); }
}
export async function removeAssignee(req, res, next) {
  try {
    await requestService.removeAssignee(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (e) { next(e); }
}
export async function history(req, res, next) {
  try { res.status(200).json(await requestService.getHistory(req.params.id)); } catch (e) { next(e); }
}