import {
  getEquipmentList,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../services/equipment.service.js";

export function getEquipmentListHandler(req, res) {
  const result = getEquipmentList(req.query);

  res.status(200).json(result);
}

export function getEquipment(req, res) {
  const equipment = getEquipmentById(req.params.id);

  res.status(200).json({
    data: equipment,
  });
}

export function createEquipmentHandler(req, res) {
  const equipment = createEquipment(req.body);

  res.status(201).location(`/api/equipment/${equipment.id}`).json({
    data: equipment,
  });
}

export function updateEquipmentHandler(req, res) {
  const equipment = updateEquipment(req.params.id, req.body);

  res.status(200).json({
    data: equipment,
  });
}

export function deleteEquipmentHandler(req, res) {
  deleteEquipment(req.params.id);

  res.status(204).send();
}
