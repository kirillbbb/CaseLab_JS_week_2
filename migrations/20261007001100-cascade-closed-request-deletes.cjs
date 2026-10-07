module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint(
      "maintenance_requests",
      "maintenance_requests_equipment_id_fkey",
    );
    await queryInterface.addConstraint("maintenance_requests", {
      fields: ["equipment_id"],
      type: "foreign key",
      name: "maintenance_requests_equipment_id_fkey",
      references: { table: "equipment", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.removeConstraint(
      "request_status_history",
      "request_status_history_request_id_fkey",
    );
    await queryInterface.addConstraint("request_status_history", {
      fields: ["request_id"],
      type: "foreign key",
      name: "request_status_history_request_id_fkey",
      references: { table: "maintenance_requests", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "request_status_history",
      "request_status_history_request_id_fkey",
    );
    await queryInterface.addConstraint("request_status_history", {
      fields: ["request_id"],
      type: "foreign key",
      name: "request_status_history_request_id_fkey",
      references: { table: "maintenance_requests", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface.removeConstraint(
      "maintenance_requests",
      "maintenance_requests_equipment_id_fkey",
    );
    await queryInterface.addConstraint("maintenance_requests", {
      fields: ["equipment_id"],
      type: "foreign key",
      name: "maintenance_requests_equipment_id_fkey",
      references: { table: "equipment", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
