import request from "supertest";

import { app } from "./helpers/app.js";

describe("Equipment", () => {
  it("returns empty equipment list initially", async () => {
    const response = await request(app).get("/api/equipment");

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject({
      data: expect.any(Array),
      meta: {
        page: 1,
        limit: 20,
      },
    });
  });

  it("returns 422 for invalid page", async () => {
    const response = await request(app).get("/api/equipment?page=abc");

    expect(response.statusCode).toBe(422);

    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Invalid query parameters",
    });

    expect(response.body.error.details).toEqual([
      {
        field: "page",
        reason: "must be a positive integer",
      },
    ]);
  });

  it("returns 422 for invalid limit", async () => {
    const response = await request(app).get("/api/equipment?limit=101");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual([
      {
        field: "limit",
        reason: "must be an integer between 1 and 100",
      },
    ]);
  });

  it("returns 422 for invalid sort order", async () => {
    const response = await request(app).get("/api/equipment?sortOrder=random");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual([
      {
        field: "sortOrder",
        reason: "must be either asc or desc",
      },
    ]);
  });

  it("creates equipment", async () => {
    const response = await createEquipment();

    expect(response.statusCode).toBe(201);

    expect(response.headers.location).toMatch(/^\/api\/equipment\/.+$/);

    expect(response.body.data).toMatchObject({
      name: "Test Equipment",
      type: "turbine",
      serialNumber: expect.any(String),
      location: {
        lat: 56.3269,
        lon: 44.0059,
      },
      status: "operational",
      installedAt: "2025-01-01T00:00:00.000Z",
    });

    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.updatedAt).toEqual(expect.any(String));
  });

  it("returns equipment by id", async () => {
    const createResponse = await createEquipment();

    const { id } = createResponse.body.data;

    const response = await request(app).get(`/api/equipment/${id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual(createResponse.body.data);
  });

  it("returns 404 for unknown equipment", async () => {
    const response = await request(app).get("/api/equipment/non-existent-id");

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });

  it("updates equipment", async () => {
    const createResponse = await createEquipment();

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/equipment/${created.id}`)
      .send({
        name: "Updated Equipment",
        status: "maintenance",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.data.name).toBe("Updated Equipment");
    expect(response.body.data.status).toBe("maintenance");
    expect(response.body.data.id).toBe(created.id);
    expect(response.body.data.createdAt).toBe(created.createdAt);
    expect(response.body.data.updatedAt).not.toBe(created.updatedAt);
  });

  it("deletes equipment", async () => {
    const createResponse = await createEquipment();

    const { id } = createResponse.body.data;

    const deleteResponse = await request(app).delete(`/api/equipment/${id}`);

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app).get(`/api/equipment/${id}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it("returns 422 when required fields are missing", async () => {
    const response = await request(app).post("/api/equipment").send({
      name: "Test Equipment",
    });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: "type",
          reason: "is required",
        },
        {
          field: "serialNumber",
          reason: "is required",
        },
        {
          field: "location",
          reason: "is required",
        },
        {
          field: "status",
          reason: "is required",
        },
        {
          field: "installedAt",
          reason: "is required",
        },
      ]),
    );
  });

  it("returns 422 when name is shorter than 3 characters", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "AB",
        type: "turbine",
        serialNumber: "SHORT-NAME-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "name",
      reason: "must contain between 3 and 100 characters",
    });
  });

  it("returns 422 when name is longer than 100 characters", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "A".repeat(101),
        type: "turbine",
        serialNumber: "LONG-NAME-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "name",
      reason: "must contain between 3 and 100 characters",
    });
  });

  it("returns 422 for invalid equipment type", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "machine",
        serialNumber: "TYPE-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "type",
      reason: "must be one of: turbine, inverter, sensor, substation",
    });
  });

  it("returns 422 for invalid equipment status", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "turbine",
        serialNumber: "STATUS-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "broken",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "status",
      reason: "must be one of: operational, maintenance, fault, decommissioned",
    });
  });

  it("returns 422 for invalid location", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "turbine",
        serialNumber: "LOCATION-001",
        location: {
          lat: "56.3269",
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "location",
      reason: "must contain numeric lat and lon",
    });
  });

  it("returns 422 for invalid installedAt", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "turbine",
        serialNumber: "DATE-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "not-a-date",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "installedAt",
      reason: "must be a valid ISO date",
    });
  });

  it("returns 422 when installedAt is in the future", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "turbine",
        serialNumber: "FUTURE-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2999-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "installedAt",
      reason: "must not be in the future",
    });
  });

  it("returns 409 for duplicate serial number", async () => {
    const firstResponse = await createEquipment({
      serialNumber: "DUPLICATE-001",
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await createEquipment({
      serialNumber: "DUPLICATE-001",
    });

    expect(secondResponse.statusCode).toBe(409);

    expect(secondResponse.body.error.code).toBe("SERIAL_NUMBER_ALREADY_EXISTS");
  });

  it("returns 409 when changing serial number to an existing one", async () => {
    const firstResponse = await createEquipment({
      serialNumber: "EXISTING-001",
    });

    const secondResponse = await createEquipment({
      serialNumber: "EXISTING-002",
    });

    const secondId = secondResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/equipment/${secondId}`)
      .send({
        serialNumber: "EXISTING-001",
      });

    expect(firstResponse.statusCode).toBe(201);
    expect(response.statusCode).toBe(409);

    expect(response.body.error.code).toBe("SERIAL_NUMBER_ALREADY_EXISTS");
  });

  it("ignores unknown body fields", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Test Equipment",
        type: "turbine",
        serialNumber: "UNKNOWN-FIELD-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
        unknownField: "should be ignored",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).not.toHaveProperty("unknownField");
  });

  it("does not allow changing server-managed fields", async () => {
    const createResponse = await createEquipment();

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/equipment/${created.id}`)
      .send({
        name: "Updated Equipment",
        id: "fake-id",
        createdAt: "2000-01-01T00:00:00.000Z",
        updatedAt: "2000-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.data.id).toBe(created.id);
    expect(response.body.data.createdAt).toBe(created.createdAt);
    expect(response.body.data.updatedAt).not.toBe("2000-01-01T00:00:00.000Z");
  });

  it("returns 422 for invalid field type", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: 123,
        type: "turbine",
        serialNumber: "INVALID-NAME-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual([
      {
        field: "name",
        reason: "must be a string",
      },
    ]);
  });

  it("returns 409 when deleting equipment with open requests", async () => {
    const equipmentResponse = await createEquipment({
      serialNumber: "OPEN-REQUEST-001",
    });

    const equipmentId = equipmentResponse.body.data.id;

    const requestResponse = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Inspect equipment",
      priority: "high",
    });

    expect(requestResponse.statusCode).toBe(201);

    const deleteResponse = await request(app).delete(
      `/api/equipment/${equipmentId}`,
    );

    expect(deleteResponse.statusCode).toBe(409);

    expect(deleteResponse.body.error.code).toBe("EQUIPMENT_HAS_OPEN_REQUESTS");
  });

  it("allows deleting equipment when all requests are closed", async () => {
    const equipmentResponse = await createEquipment({
      serialNumber: "CLOSED-REQUEST-001",
    });

    const equipmentId = equipmentResponse.body.data.id;

    const requestResponse = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Inspect equipment",
      priority: "high",
    });

    const requestId = requestResponse.body.data.id;

    const statusResponse = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({
        status: "rejected",
      });

    expect(statusResponse.statusCode).toBe(200);

    const deleteResponse = await request(app).delete(
      `/api/equipment/${equipmentId}`,
    );

    expect(deleteResponse.statusCode).toBe(204);
  });
});

async function createEquipment(overrides = {}) {
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
