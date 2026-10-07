module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.removeConstraint(
      "maintenance_requests",
      "maintenance_requests_equipment_id_fkey",
    );

    await queryInterface.addConstraint("maintenance_requests", {
      fields: ["equipment_id"],
      type: "foreign key",
      name: "maintenance_requests_equipment_id_fkey",
      references: {
        table: "equipment",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "maintenance_requests",
      "maintenance_requests_equipment_id_fkey",
    );

    await queryInterface.addConstraint("maintenance_requests", {
      fields: ["equipment_id"],
      type: "foreign key",
      name: "maintenance_requests_equipment_id_fkey",
      references: {
        table: "equipment",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
