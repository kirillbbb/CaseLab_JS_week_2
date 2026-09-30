module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("request_assignees", {
      request_id: {
        type: Sequelize.UUID, allowNull: false, primaryKey: true,
        references: { model: "maintenance_requests", key: "id" },
        onUpdate: "CASCADE", onDelete: "CASCADE",
      },
      technician_id: {
        type: Sequelize.UUID, allowNull: false, primaryKey: true,
        references: { model: "technicians", key: "id" },
        onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      role: { type: Sequelize.ENUM("lead", "member"), allowNull: false },
      hours: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    });
    await queryInterface.addIndex("request_assignees", ["technician_id"]);
    await queryInterface.addIndex("request_assignees", ["request_id"]);
    await queryInterface.addIndex("request_assignees", ["request_id"], {
      unique: true,
      name: "request_assignees_one_lead_per_request",
      where: { role: "lead" },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("request_assignees");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_request_assignees_role";');
  },
};