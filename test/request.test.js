import request from "supertest";

import { app } from "./helpers/app.js";

describe("Requests", () => {
  let equipmentId;

  beforeAll(async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "Request Test Equipment",
        type: "turbine",
        serialNumber: "REQUEST-TEST-EQUIPMENT-001",
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(201);

    equipmentId = response.body.data.id;
  });

  it("creates a request", async () => {
    const response = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Inspect turbine bearings",
      description: "Check bearings for wear",
      priority: "high",
    });

    expect(response.statusCode).toBe(201);

    expect(response.headers.location).toMatch(/^\/api\/requests\/.+$/);

    expect(response.body.data).toMatchObject({
      equipmentId,
      title: "Inspect turbine bearings",
      description: "Check bearings for wear",
      priority: "high",
      status: "new",
    });

    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.updatedAt).toEqual(expect.any(String));
  });

  it("returns 404 for unknown equipment", async () => {
    const response = await request(app).post("/api/requests").send({
      equipmentId: "unknown-equipment-id",
      title: "Check equipment",
      priority: "low",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });

  it("returns 422 for invalid request body", async () => {
    const response = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Bad",
      priority: "urgent",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: "title",
          reason: "must contain at least 5 characters",
        },
        {
          field: "priority",
          reason: "must be one of: low, medium, high, critical",
        },
      ]),
    );
  });

  it("ignores unknown fields", async () => {
    const response = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Replace sensor",
      priority: "low",
      unknownField: "ignored",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).not.toHaveProperty("unknownField");
  });

  it("returns a request by id", async () => {
    const createResponse = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Inspect generator",
      priority: "high",
    });

    const { id } = createResponse.body.data;

    const response = await request(app).get(`/api/requests/${id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual(createResponse.body.data);
  });

  it("returns 404 for unknown request", async () => {
    const response = await request(app).get(
      "/api/requests/non-existent-request",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
  });

  it("returns requests for equipment", async () => {
    const response = await request(app).get(
      `/api/equipment/${equipmentId}/requests`,
    );

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("meta");

    expect(response.body.meta).toHaveProperty("total");
    expect(response.body.meta).toHaveProperty("page");
    expect(response.body.meta).toHaveProperty("limit");

    expect(
      response.body.data.every((item) => item.equipmentId === equipmentId),
    ).toBe(true);
  });

  it("returns 404 for unknown equipment requests", async () => {
    const response = await request(app).get(
      "/api/equipment/non-existent-equipment/requests",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });

  it("updates a request", async () => {
    const createResponse = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Old request title",
      priority: "low",
    });

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/requests/${created.id}`)
      .send({
        title: "New request title",
        priority: "high",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.title).toBe("New request title");
    expect(response.body.data.priority).toBe("high");
    expect(response.body.data.id).toBe(created.id);
    expect(response.body.data.status).toBe("new");
  });

  it("does not allow changing server fields", async () => {
    const createResponse = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Original request",
      priority: "medium",
    });

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/requests/${created.id}`)
      .send({
        title: "Updated request",
        id: "fake-id",
        equipmentId: "fake-equipment",
        status: "done",
        createdAt: "2000-01-01T00:00:00.000Z",
        updatedAt: "2000-01-01T00:00:00.000Z",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.id).toBe(created.id);
    expect(response.body.data.equipmentId).toBe(created.equipmentId);
    expect(response.body.data.status).toBe("new");
    expect(response.body.data.createdAt).toBe(created.createdAt);
  });

  it("changes status from new to in_progress", async () => {
    const response = await createRequest();

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "in_progress",
      });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.status).toBe("in_progress");
  });

  it("changes status from in_progress to done", async () => {
    const response = await createRequest();

    await request(app).patch(`/api/requests/${response.id}/status`).send({
      status: "in_progress",
    });

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "done",
      });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.status).toBe("done");
  });

  it("changes status from new to rejected", async () => {
    const response = await createRequest();

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "rejected",
      });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.status).toBe("rejected");
  });

  it("changes status from in_progress to rejected", async () => {
    const response = await createRequest();

    await request(app).patch(`/api/requests/${response.id}/status`).send({
      status: "in_progress",
    });

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "rejected",
      });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.status).toBe("rejected");
  });

  it("returns 409 for invalid new to done transition", async () => {
    const response = await createRequest();

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "done",
      });

    expect(result.statusCode).toBe(409);
    expect(result.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("returns 409 after done", async () => {
    const response = await createRequest();

    await request(app).patch(`/api/requests/${response.id}/status`).send({
      status: "in_progress",
    });

    await request(app).patch(`/api/requests/${response.id}/status`).send({
      status: "done",
    });

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "rejected",
      });

    expect(result.statusCode).toBe(409);
  });

  it("returns 409 after rejected", async () => {
    const response = await createRequest();

    await request(app).patch(`/api/requests/${response.id}/status`).send({
      status: "rejected",
    });

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "in_progress",
      });

    expect(result.statusCode).toBe(409);
  });

  it("returns 422 for invalid status", async () => {
    const response = await createRequest();

    const result = await request(app)
      .patch(`/api/requests/${response.id}/status`)
      .send({
        status: "unknown",
      });

    expect(result.statusCode).toBe(422);
    expect(result.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deletes a request", async () => {
    const response = await createRequest();

    const deleteResponse = await request(app).delete(
      `/api/requests/${response.id}`,
    );

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app).get(`/api/requests/${response.id}`);

    expect(getResponse.statusCode).toBe(404);
  });

  async function createRequest() {
    const response = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Test maintenance request",
      priority: "medium",
    });

    expect(response.statusCode).toBe(201);

    return response.body.data;
  }
});
