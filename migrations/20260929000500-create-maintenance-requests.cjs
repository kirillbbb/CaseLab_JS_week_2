module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("maintenance_requests", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      equipment_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "equipment", key: "id" },
        onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      title: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priority: { type: Sequelize.ENUM("low", "medium", "high", "critical"), allowNull: false, defaultValue: "medium" },
      status: { type: Sequelize.ENUM("new", "in_progress", "done", "rejected"), allowNull: false, defaultValue: "new" },
      planned_at: { type: Sequelize.DATE, allowNull: true },
      author: { type: Sequelize.STRING(120), allowNull: false, defaultValue: "system" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex("maintenance_requests", ["equipment_id", "created_at"]);
    await queryInterface.addIndex("maintenance_requests", ["status"]);
    await queryInterface.addIndex("maintenance_requests", ["priority"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("maintenance_requests");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_maintenance_requests_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_maintenance_requests_status";');
  },
};