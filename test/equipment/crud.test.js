import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment } from "../helpers/factories.js";

describe("Equipment CRUD", () => {
  it("creates equipment", async () => {
    const response = await createEquipment({
      serialNumber: `CRUD-CREATE-${Date.now()}`,
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers.location).toMatch(/^\/api\/equipment\/.+$/);

    expect(response.body.data).toMatchObject({
      name: "Test Equipment",
      type: "turbine",
      status: "operational",
    });

    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.updatedAt).toEqual(expect.any(String));
  });

  it("returns equipment by id", async () => {
    const createResponse = await createEquipment({
      serialNumber: `CRUD-GET-${Date.now()}`,
    });

    const created = createResponse.body.data;

    const response = await request(app).get(`/api/equipment/${created.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual(created);
  });

  it("returns 404 for unknown equipment", async () => {
    const response = await request(app).get(
      "/api/equipment/non-existent-equipment",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });

  it("updates equipment", async () => {
    const createResponse = await createEquipment({
      serialNumber: `CRUD-UPDATE-${Date.now()}`,
      name: "Old Equipment",
    });

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

  it("does not allow changing server-managed fields", async () => {
    const createResponse = await createEquipment({
      serialNumber: `CRUD-SERVER-FIELDS-${Date.now()}`,
    });

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

  it("ignores unknown fields during update", async () => {
    const createResponse = await createEquipment({
      serialNumber: `CRUD-UNKNOWN-${Date.now()}`,
    });

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/equipment/${created.id}`)
      .send({
        name: "Updated Equipment",
        unknownField: "ignored",
        anotherUnknownField: 123,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Updated Equipment");
    expect(response.body.data).not.toHaveProperty("unknownField");
    expect(response.body.data).not.toHaveProperty("anotherUnknownField");
  });

  it("deletes equipment", async () => {
    const createResponse = await createEquipment({
      serialNumber: `CRUD-DELETE-${Date.now()}`,
    });

    const { id } = createResponse.body.data;

    const deleteResponse = await request(app).delete(`/api/equipment/${id}`);

    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toEqual({});

    const getResponse = await request(app).get(`/api/equipment/${id}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it("returns 404 when deleting unknown equipment", async () => {
    const response = await request(app).delete(
      "/api/equipment/non-existent-equipment",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");
  });
});
