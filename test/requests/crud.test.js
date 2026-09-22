import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Requests CRUD", () => {
  let equipmentId;

  beforeAll(async () => {
    const response = await createEquipment({
      serialNumber: "REQUEST-CRUD-EQUIPMENT-001",
    });

    expect(response.statusCode).toBe(201);

    equipmentId = response.body.data.id;
  });

  it("creates a request", async () => {
    const response = await createRequest(equipmentId, {
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

  it("returns a request by id", async () => {
    const createResponse = await createRequest(equipmentId);
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

  it("updates a request", async () => {
    const createResponse = await createRequest(equipmentId, {
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
    expect(response.body.data.equipmentId).toBe(created.equipmentId);
    expect(response.body.data.createdAt).toBe(created.createdAt);
  });

  it("does not allow changing server-managed fields", async () => {
    const createResponse = await createRequest(equipmentId);
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
    expect(response.body.data.updatedAt).not.toBe("2000-01-01T00:00:00.000Z");
  });

  it("deletes a request", async () => {
    const createResponse = await createRequest(equipmentId);
    const { id } = createResponse.body.data;

    const deleteResponse = await request(app).delete(`/api/requests/${id}`);

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app).get(`/api/requests/${id}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it("ignores unknown fields during update", async () => {
    const createResponse = await createRequest(equipmentId);

    const created = createResponse.body.data;

    const response = await request(app)
      .patch(`/api/requests/${created.id}`)
      .send({
        title: "Updated request",
        unknownField: "should be ignored",
        anotherUnknownField: 123,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.title).toBe("Updated request");
    expect(response.body.data).not.toHaveProperty("unknownField");
    expect(response.body.data).not.toHaveProperty("anotherUnknownField");
  });

  it("returns 404 when deleting unknown request", async () => {
    const response = await request(app).delete(
      "/api/requests/non-existent-request",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
  });
});
