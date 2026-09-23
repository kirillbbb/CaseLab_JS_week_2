import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment } from "../helpers/factories.js";

describe("Equipment validation", () => {
  it("returns 422 when required fields are missing", async () => {
    const response = await request(app).post("/api/equipment").send({});

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: "name",
          reason: "is required",
        },
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

  it("returns 422 for invalid page", async () => {
    const response = await request(app).get("/api/equipment?page=abc");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "page",
      reason: "must be a positive integer",
    });
  });

  it("returns 422 for invalid limit", async () => {
    const response = await request(app).get("/api/equipment?limit=101");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "limit",
      reason: "must be an integer between 1 and 100",
    });
  });

  it("returns 422 for invalid sort field", async () => {
    const response = await request(app).get("/api/equipment?sortBy=unknown");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "sortBy",
      reason:
        "must be one of: name, type, status, location, createdAt, updatedAt",
    });
  });

  it("returns 422 for invalid sort order", async () => {
    const response = await request(app).get("/api/equipment?sortOrder=random");

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toContainEqual({
      field: "sortOrder",
      reason: "must be either asc or desc",
    });
  });

  it("returns 422 for invalid equipment body", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .send({
        name: "",
        type: "invalid",
        serialNumber: "",
        location: {
          lat: "invalid",
          lon: "invalid",
        },
        status: "invalid",
        installedAt: "not-a-date",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it("ignores unknown fields during creation", async () => {
    const response = await createEquipment({
      serialNumber: `VALIDATION-UNKNOWN-${Date.now()}`,
      unknownField: "ignored",
      anotherUnknownField: 123,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).not.toHaveProperty("unknownField");
    expect(response.body.data).not.toHaveProperty("anotherUnknownField");
  });

  it("allows partial update", async () => {
    const createResponse = await createEquipment({
      serialNumber: `VALIDATION-PATCH-${Date.now()}`,
      name: "Original Equipment",
    });

    const id = createResponse.body.data.id;

    const response = await request(app).patch(`/api/equipment/${id}`).send({
      name: "Updated Equipment",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Updated Equipment");
  });
});
