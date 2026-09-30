module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("request_status_history", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      request_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "maintenance_requests", key: "id" },
        onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      from_status: { type: Sequelize.ENUM("new", "in_progress", "done", "rejected"), allowNull: true },
      to_status: { type: Sequelize.ENUM("new", "in_progress", "done", "rejected"), allowNull: false },
      changed_by: { type: Sequelize.STRING(120), allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      changed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("request_status_history", ["request_id", "changed_at"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("request_status_history");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_request_status_history_from_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_request_status_history_to_status";');
  },
};