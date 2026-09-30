import { DataTypes, Model } from "sequelize";

export class EquipmentPassport extends Model {}

export function initEquipmentPassport(sequelize) {
  EquipmentPassport.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    equipmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "equipment_id" },
    manufacturer: { type: DataTypes.STRING(120), allowNull: false },
    model: { type: DataTypes.STRING(120), allowNull: false },
    ratedPower: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: "rated_power" },
    lastCalibrationAt: { type: DataTypes.DATE, allowNull: true, field: "last_calibration_at" },
  }, {
    sequelize, modelName: "EquipmentPassport", tableName: "equipment_passports", timestamps: true, underscored: true,
  });
  return EquipmentPassport;
}