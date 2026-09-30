import { DataTypes, Model } from "sequelize";

export class RequestAssignee extends Model {}

export function initRequestAssignee(sequelize) {
  RequestAssignee.init({
    requestId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: "request_id" },
    technicianId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: "technician_id" },
    role: { type: DataTypes.ENUM("lead", "member"), allowNull: false },
    hours: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
  }, {
    sequelize, modelName: "RequestAssignee", tableName: "request_assignees", timestamps: false, underscored: true,
  });
  return RequestAssignee;
}