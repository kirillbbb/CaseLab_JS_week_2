import { DataTypes, Model } from "sequelize";

export class RequestStatusHistory extends Model {}

export function initRequestStatusHistory(sequelize) {
  RequestStatusHistory.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    requestId: { type: DataTypes.UUID, allowNull: false, field: "request_id" },
    fromStatus: { type: DataTypes.ENUM("new", "in_progress", "done", "rejected"), allowNull: true, field: "from_status" },
    toStatus: { type: DataTypes.ENUM("new", "in_progress", "done", "rejected"), allowNull: false, field: "to_status" },
    changedBy: { type: DataTypes.STRING(120), allowNull: false, field: "changed_by" },
    comment: { type: DataTypes.TEXT, allowNull: true },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "changed_at" },
  }, {
    sequelize, modelName: "RequestStatusHistory", tableName: "request_status_history", timestamps: false, underscored: true,
  });
  return RequestStatusHistory;
}