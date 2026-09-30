import { DataTypes, Model } from "sequelize";

export class Site extends Model {}

export function initSite(sequelize) {
  Site.init({
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    region: { type: DataTypes.STRING(120), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
  }, {
    sequelize, modelName: "Site", tableName: "sites", timestamps: true, underscored: true,
  });
  return Site;
}