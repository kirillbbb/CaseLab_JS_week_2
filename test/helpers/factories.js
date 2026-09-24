import request from "supertest";

import { app } from "./app.js";

export async function createEquipment(overrides = {}) {
  return request(app)
    .post("/api/equipment")
    .send({
      name: "Test Equipment",
      type: "turbine",
      serialNumber: `SN-${Date.now()}-${Math.random()}`,
      location: {
        lat: 56.3269,
        lon: 44.0059,
      },
      status: "operational",
      installedAt: "2025-01-01T00:00:00.000Z",
      ...overrides,
    });
}

export async function createRequest(equipmentId, overrides = {}) {
  return request(app)
    .post("/api/requests")
    .send({
      equipmentId,
      title: "Test maintenance request",
      priority: "medium",
      ...overrides,
    });
}
