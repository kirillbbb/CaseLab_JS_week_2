import { DataTypes, Model } from "sequelize";

export class Technician extends Model {}

export function initTechnician(sequelize) {
  Technician.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    fullName: { type: DataTypes.STRING(160), allowNull: false, field: "full_name" },
    specialization: { type: DataTypes.STRING(160), allowNull: false },
    employeeNumber: { type: DataTypes.STRING(60), allowNull: false, unique: true, field: "employee_number" },
  }, {
    sequelize, modelName: "Technician", tableName: "technicians", timestamps: true, underscored: true,
  });
  return Technician;
}