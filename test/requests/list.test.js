import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Requests list", () => {
  let turbineId;
  let sensorId;

  beforeAll(async () => {
    const turbineResponse = await createEquipment({
      type: "turbine",
      serialNumber: "REQUEST-LIST-TURBINE-001",
    });

    const sensorResponse = await createEquipment({
      type: "sensor",
      serialNumber: "REQUEST-LIST-SENSOR-001",
    });

    expect(turbineResponse.statusCode).toBe(201);
    expect(sensorResponse.statusCode).toBe(201);

    turbineId = turbineResponse.body.data.id;
    sensorId = sensorResponse.body.data.id;
  });

  it("returns request list with pagination metadata", async () => {
    const response = await request(app).get("/api/requests");

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject({
      data: expect.any(Array),
      meta: {
        total: expect.any(Number),
        page: 1,
        limit: 20,
      },
    });
  });

  it("filters by status", async () => {
    await createRequest(turbineId, {
      title: "New status request",
      priority: "low",
    });

    const response = await request(app).get("/api/requests?status=new");

    expect(response.statusCode).toBe(200);

    expect(response.body.data.every((item) => item.status === "new")).toBe(
      true,
    );
  });

  it("filters by priority", async () => {
    await createRequest(turbineId, {
      title: "High priority request",
      priority: "high",
    });

    const response = await request(app).get("/api/requests?priority=high");

    expect(response.statusCode).toBe(200);

    expect(response.body.data.every((item) => item.priority === "high")).toBe(
      true,
    );
  });

  it("filters by equipmentId", async () => {
    await createRequest(sensorId, {
      title: "Sensor maintenance request",
    });

    const response = await request(app).get(
      `/api/requests?equipmentId=${sensorId}`,
    );

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.every((item) => item.equipmentId === sensorId),
    ).toBe(true);
  });

  it("filters by equipment type", async () => {
    await createRequest(turbineId, {
      title: "Turbine maintenance request",
    });

    const response = await request(app).get("/api/requests?type=turbine");

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.every((item) => item.equipmentId === turbineId),
    ).toBe(true);
  });

  it("returns 422 for invalid status filter", async () => {
    const response = await request(app).get("/api/requests?status=invalid");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "status",
      reason: "must be one of: new, in_progress, done, rejected",
    });
  });

  it("returns 422 for invalid priority filter", async () => {
    const response = await request(app).get("/api/requests?priority=urgent");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "priority",
      reason: "must be one of: low, medium, high, critical",
    });
  });

  it("returns 422 for invalid equipment type filter", async () => {
    const response = await request(app).get("/api/requests?type=machine");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "type",
      reason: "must be one of: turbine, inverter, sensor, substation",
    });
  });

  it("returns 422 for invalid page", async () => {
    const response = await request(app).get("/api/requests?page=abc");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "page",
      reason: "must be a positive integer",
    });
  });

  it("returns 422 for invalid limit", async () => {
    const response = await request(app).get("/api/requests?limit=101");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "limit",
      reason: "must be an integer between 1 and 100",
    });
  });

  it("returns 422 for invalid sort field", async () => {
    const response = await request(app).get("/api/requests?sortBy=unknown");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "sortBy",
      reason:
        "must be one of: createdAt, updatedAt, plannedAt, title, priority, status",
    });
  });

  it("returns 422 for invalid sort order", async () => {
    const response = await request(app).get("/api/requests?sortOrder=random");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "sortOrder",
      reason: "must be either asc or desc",
    });
  });

  it("returns 422 for invalid dateFrom", async () => {
    const response = await request(app).get(
      "/api/requests?dateFrom=not-a-date",
    );

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "dateFrom",
      reason: "must be a valid ISO date-time",
    });
  });

  it("returns 422 for invalid dateTo", async () => {
    const response = await request(app).get("/api/requests?dateTo=not-a-date");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "dateTo",
      reason: "must be a valid ISO date-time",
    });
  });

  it("returns 422 when dateFrom is later than dateTo", async () => {
    const response = await request(app).get(
      "/api/requests?dateFrom=2026-02-01T00:00:00.000Z&dateTo=2026-01-01T00:00:00.000Z",
    );

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "dateFrom",
      reason: "must be less than or equal to dateTo",
    });
  });
});
