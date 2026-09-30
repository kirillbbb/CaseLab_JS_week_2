import * as equipmentService from "../services/equipment.service.js";
export async function getEquipmentListHandler(req, res, next) {
  try { res.status(200).json(await equipmentService.getEquipmentList(req.query)); } catch (e) { next(e); }
}
export async function getEquipment(req, res, next) {
  try { res.status(200).json({ data: await equipmentService.getEquipmentById(req.params.id) }); } catch (e) { next(e); }
}
export async function createEquipmentHandler(req, res, next) {
  try {
    const equipment = await equipmentService.createEquipment(req.body);
    res.status(201).location(`/api/equipment/${equipment.id}`).json({ data: equipment });
  } catch (e) { next(e); }
}
export async function updateEquipmentHandler(req, res, next) {
  try { res.status(200).json({ data: await equipmentService.updateEquipment(req.params.id, req.body) }); } catch (e) { next(e); }
}
export async function deleteEquipmentHandler(req, res, next) {
  try { await equipmentService.deleteEquipment(req.params.id); res.status(204).send(); } catch (e) { next(e); }
}