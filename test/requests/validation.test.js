import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Requests validation", () => {
  let equipmentId;

  beforeAll(async () => {
    const response = await createEquipment({
      serialNumber: "REQUEST-VALIDATION-EQUIPMENT-001",
    });

    expect(response.statusCode).toBe(201);

    equipmentId = response.body.data.id;
  });

  it("returns 404 for unknown equipment", async () => {
    const response = await createRequest("unknown-equipment-id", {
      title: "Check equipment",
      priority: "low",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });

  it("returns 422 when required fields are missing", async () => {
    const response = await request(app).post("/api/requests").send({});

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: "equipmentId",
          reason: "is required",
        },
        {
          field: "title",
          reason: "is required",
        },
      ]),
    );
  });

  it.each([
    ["Bad", "must contain at least 5 characters"],
    ["A".repeat(121), "must contain at most 120 characters"],
  ])("validates title length", async (title, reason) => {
    const response = await createRequest(equipmentId, {
      title,
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "title",
      reason,
    });
  });

  it("returns 422 for invalid priority", async () => {
    const response = await createRequest(equipmentId, {
      priority: "urgent",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "priority",
      reason: "must be one of: low, medium, high, critical",
    });
  });

  it("returns 422 when description is longer than 2000 characters", async () => {
    const response = await createRequest(equipmentId, {
      description: "A".repeat(2001),
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "description",
      reason: "must contain at most 2000 characters",
    });
  });

  it("returns 422 for invalid plannedAt", async () => {
    const response = await createRequest(equipmentId, {
      plannedAt: "not-a-date",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.details).toContainEqual({
      field: "plannedAt",
      reason: "must be a valid ISO date-time",
    });
  });

  it("ignores unknown fields", async () => {
    const response = await createRequest(equipmentId, {
      unknownField: "ignored",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).not.toHaveProperty("unknownField");
  });

  it("returns 422 for an empty request id parameter", async () => {
    const response = await request(app).get("/api/requests/%20");

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual({
      field: "id",
      reason: "must be a non-empty string",
    });
  });
});
