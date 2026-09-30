import { DataTypes, Model } from "sequelize";

export class Equipment extends Model {}

export function initEquipment(sequelize) {
  Equipment.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    siteId: { type: DataTypes.UUID, allowNull: false, field: "site_id" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM("turbine", "inverter", "sensor", "substation"), allowNull: false },
    serialNumber: { type: DataTypes.STRING(120), allowNull: false, unique: true, field: "serial_number" },
    status: { type: DataTypes.ENUM("operational", "maintenance", "fault", "decommissioned"), allowNull: false },
    installedAt: { type: DataTypes.DATE, allowNull: false, field: "installed_at" },
  }, {
    sequelize, modelName: "Equipment", tableName: "equipment", timestamps: true, underscored: true,
  });
  return Equipment;
}