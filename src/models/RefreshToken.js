import { DataTypes, Model } from "sequelize";

export class RefreshToken extends Model {}

export function initRefreshToken(sequelize) {
  RefreshToken.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true, field: "token_hash" },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
    revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
  }, { sequelize, modelName: "RefreshToken", tableName: "refresh_tokens", timestamps: false, underscored: true });
  return RefreshToken;
}
