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
    const response = await request(app).post("/api/equipment").send({
      name: "CNC Machine",
      type: "machine",
      location: "Workshop A",
    });

    expect(response.statusCode).toBe(201);

    expect(response.headers.location).toMatch(/^\/api\/equipment\/.+$/);

    expect(response.body.data).toMatchObject({
      name: "CNC Machine",
      type: "machine",
      location: "Workshop A",
    });

    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.updatedAt).toEqual(expect.any(String));
  });

  it("returns equipment by id", async () => {
    const createResponse = await request(app).post("/api/equipment").send({
      name: "Generator",
      type: "generator",
      location: "Workshop B",
    });

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
    const createResponse = await request(app).post("/api/equipment").send({
      name: "Old Name",
      type: "machine",
      location: "Workshop A",
    });

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/equipment/${created.id}`)
      .send({
        name: "New Name",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("New Name");
    expect(response.body.data.id).toBe(created.id);
    expect(response.body.data.createdAt).toBe(created.createdAt);
    expect(response.body.data.updatedAt).not.toBe(created.updatedAt);
  });

  it("deletes equipment", async () => {
    const createResponse = await request(app).post("/api/equipment").send({
      name: "Temporary Equipment",
      type: "machine",
      location: "Workshop C",
    });

    const { id } = createResponse.body.data;

    const deleteResponse = await request(app).delete(`/api/equipment/${id}`);

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app).get(`/api/equipment/${id}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it("returns 422 when required fields are missing", async () => {
    const response = await request(app).post("/api/equipment").send({
      name: "CNC Machine",
    });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: "type",
          reason: "is required and must be a non-empty string",
        },
        {
          field: "location",
          reason: "is required and must be a non-empty string",
        },
      ]),
    );
  });

  it("ignores unknown body fields", async () => {
    const response = await request(app).post("/api/equipment").send({
      name: "CNC Machine",
      type: "machine",
      location: "Workshop A",
      unknownField: "should be ignored",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).not.toHaveProperty("unknownField");
  });

  it("does not allow client to change server-managed fields", async () => {
    const createResponse = await request(app).post("/api/equipment").send({
      name: "CNC Machine",
      type: "machine",
      location: "Workshop A",
    });

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/equipment/${created.id}`)
      .send({
        name: "Updated Machine",
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
    const response = await request(app).post("/api/equipment").send({
      name: 123,
      type: "machine",
      location: "Workshop A",
    });

    expect(response.statusCode).toBe(422);

    expect(response.body.error.details).toEqual([
      {
        field: "name",
        reason: "must be a non-empty string",
      },
    ]);
  });
});
