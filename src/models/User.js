import { DataTypes, Model } from "sequelize";

export class User extends Model {}

export function initUser(sequelize) {
  User.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
    role: { type: DataTypes.ENUM("viewer", "technician", "admin"), allowNull: false, defaultValue: "viewer" },
  }, { sequelize, modelName: "User", tableName: "users", timestamps: true, underscored: true });
  return User;
}
