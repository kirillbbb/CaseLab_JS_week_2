module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("equipment", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      site_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "sites", key: "id" },
        onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      type: { type: Sequelize.ENUM("turbine", "inverter", "sensor", "substation"), allowNull: false },
      serial_number: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      status: { type: Sequelize.ENUM("operational", "maintenance", "fault", "decommissioned"), allowNull: false, defaultValue: "operational" },
      installed_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("equipment", ["site_id"]);
    await queryInterface.addIndex("equipment", ["status"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("equipment");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_type";');
  },
};