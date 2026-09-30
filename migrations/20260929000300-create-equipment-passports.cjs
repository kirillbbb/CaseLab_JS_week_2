module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("equipment_passports", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      equipment_id: {
        type: Sequelize.UUID, allowNull: false, unique: true,
        references: { model: "equipment", key: "id" },
        onUpdate: "CASCADE", onDelete: "CASCADE",
      },
      manufacturer: { type: Sequelize.STRING(120), allowNull: false },
      model: { type: Sequelize.STRING(120), allowNull: false },
      rated_power: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      last_calibration_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable("equipment_passports"); },
};