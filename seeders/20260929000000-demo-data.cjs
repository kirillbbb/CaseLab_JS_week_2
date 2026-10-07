const sites = [
  { id: "10000000-0000-4000-8000-000000000001", name: "North Wind Farm", code: "NWF-01", region: "Nizhny Novgorod", latitude: 56.3269, longitude: 44.0059 },
  { id: "10000000-0000-4000-8000-000000000002", name: "South Wind Farm", code: "SWF-01", region: "Nizhny Novgorod", latitude: 55.9, longitude: 43.95 },
];
const equipment = [
  ["20000000-0000-4000-8000-000000000001", sites[0].id, "Turbine A1", "turbine", "TUR-A1", "operational", "2023-01-15T00:00:00.000Z"],
  ["20000000-0000-4000-8000-000000000002", sites[0].id, "Turbine A2", "turbine", "TUR-A2", "maintenance", "2023-03-20T00:00:00.000Z"],
  ["20000000-0000-4000-8000-000000000003", sites[0].id, "Inverter A1", "inverter", "INV-A1", "operational", "2024-02-10T00:00:00.000Z"],
  ["20000000-0000-4000-8000-000000000004", sites[1].id, "Turbine B1", "turbine", "TUR-B1", "fault", "2022-11-05T00:00:00.000Z"],
  ["20000000-0000-4000-8000-000000000005", sites[1].id, "Sensor B1", "sensor", "SNS-B1", "operational", "2024-05-12T00:00:00.000Z"],
  ["20000000-0000-4000-8000-000000000006", sites[1].id, "Substation B1", "substation", "SUB-B1", "operational", "2021-09-01T00:00:00.000Z"],
];
const technicians = [
  ["30000000-0000-4000-8000-000000000001", "Иванов Иван Иванович", "Механик", "EMP-001"],
  ["30000000-0000-4000-8000-000000000002", "Петров Петр Петрович", "Электрик", "EMP-002"],
  ["30000000-0000-4000-8000-000000000003", "Сидоров Сидор Сидорович", "Автоматизация", "EMP-003"],
  ["30000000-0000-4000-8000-000000000004", "Кузнецов Алексей Викторович", "Диагностика", "EMP-004"],
  ["30000000-0000-4000-8000-000000000005", "Смирнова Анна Олеговна", "Инженер КИПиА", "EMP-005"],
];
const priorities = ["low", "medium", "high", "critical"];
const statuses = ["new", "in_progress", "done", "rejected"];
const requests = Array.from({ length: 20 }, (_, i) => {
  const equipmentId = equipment[i % equipment.length][0];
  const status = statuses[i % statuses.length];
  const created = new Date(Date.UTC(2026, 0, 1 + i));
  return {
    id: `40000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    equipment_id: equipmentId,
    title: `Плановое обслуживание ${i + 1}`,
    description: `Демонстрационная заявка ${i + 1}`,
    priority: priorities[i % priorities.length],
    status,
    planned_at: new Date(created.getTime() + 7 * 86400000),
    author: i % 2 ? "dispatcher" : "engineer",
    created_at: created,
    updated_at: new Date(created.getTime() + (status === "done" || status === "rejected" ? 2 * 86400000 : 86400000)),
  };
});

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete("request_status_history", null, {});
    await queryInterface.bulkDelete("request_assignees", null, {});
    await queryInterface.bulkDelete("maintenance_requests", { id: requests.map((r) => r.id) }, {});
    await queryInterface.bulkDelete("equipment_passports", { equipment_id: equipment.map((e) => e[0]) }, {});
    await queryInterface.bulkDelete("equipment", { id: equipment.map((e) => e[0]) }, {});
    await queryInterface.bulkDelete("technicians", { id: technicians.map((t) => t[0]) }, {});
    await queryInterface.bulkDelete("sites", { id: sites.map((s) => s.id) }, {});

    await queryInterface.bulkInsert("sites", sites.map((s) => ({ ...s, created_at: now, updated_at: now })));
    await queryInterface.bulkInsert("equipment", equipment.map(([id, site_id, name, type, serial_number, status, installed_at]) => ({
      id, site_id, name, type, serial_number, status, installed_at, created_at: now, updated_at: now,
    })));
    await queryInterface.bulkInsert("equipment_passports", equipment.map(([id], i) => ({
      id: `21000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      equipment_id: id,
      manufacturer: i % 2 ? "Siemens" : "Vestas",
      model: `Model-${i + 1}`,
      rated_power: i % 2 ? 1500 : 2000,
      last_calibration_at: new Date(Date.UTC(2025, i % 12, 10)),
      created_at: now,
      updated_at: now,
    })));
    await queryInterface.bulkInsert("technicians", technicians.map(([id, full_name, specialization, employee_number]) => ({
      id, full_name, specialization, employee_number, created_at: now, updated_at: now,
    })));
    await queryInterface.bulkInsert("maintenance_requests", requests);

    const history = [];
    for (let i = 0; i < requests.length; i += 1) {
      const r = requests[i];
      if (r.status === "in_progress") {
        history.push({
          id: `41000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          request_id: r.id, from_status: "new", to_status: "in_progress",
          changed_by: "seed", comment: "Started", changed_at: new Date(r.created_at.getTime() + 86400000),
        });
      } else if (r.status === "done") {
        history.push({
          id: `41000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          request_id: r.id, from_status: "new", to_status: "in_progress",
          changed_by: "seed", comment: "Started", changed_at: new Date(r.created_at.getTime() + 86400000),
        });
        history.push({
          id: `42000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          request_id: r.id, from_status: "in_progress", to_status: "done",
          changed_by: "seed", comment: "Completed", changed_at: new Date(r.created_at.getTime() + 2 * 86400000),
        });
      } else if (r.status === "rejected") {
        history.push({
          id: `43000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          request_id: r.id, from_status: "new", to_status: "rejected",
          changed_by: "seed", comment: "Rejected", changed_at: new Date(r.created_at.getTime() + 86400000),
        });
      }
    }
    if (history.length) await queryInterface.bulkInsert("request_status_history", history);

    const assignees = requests.map((r, i) => ({
      request_id: r.id,
      technician_id: technicians[i % technicians.length][0],
      role: "lead",
      hours: 2 + (i % 5),
    }));
    await queryInterface.bulkInsert("request_assignees", assignees);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("request_status_history", null, {});
    await queryInterface.bulkDelete("request_assignees", null, {});
    await queryInterface.bulkDelete("maintenance_requests", null, {});
    await queryInterface.bulkDelete("equipment_passports", null, {});
    await queryInterface.bulkDelete("equipment", null, {});
    await queryInterface.bulkDelete("technicians", null, {});
    await queryInterface.bulkDelete("sites", null, {});
  },
};
