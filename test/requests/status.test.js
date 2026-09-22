import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Request status transitions", () => {
  let equipmentId;

  beforeAll(async () => {
    const response = await createEquipment({
      serialNumber: "REQUEST-STATUS-EQUIPMENT-001",
    });

    expect(response.statusCode).toBe(201);

    equipmentId = response.body.data.id;
  });

  it("allows new -> in_progress", async () => {
    const createResponse = await createRequest(equipmentId);
    const id = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: "in_progress" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.status).toBe("in_progress");
  });

  it("allows new -> rejected", async () => {
    const createResponse = await createRequest(equipmentId);
    const id = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: "rejected" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.status).toBe("rejected");
  });

  it.each([
    ["new", "done"],
    ["done", "rejected"],
    ["rejected", "in_progress"],
  ])("returns 409 for invalid transition to %s", async (from, to) => {
    const createResponse = await createRequest(equipmentId);
    const id = createResponse.body.data.id;

    if (from === "done") {
      await request(app)
        .patch(`/api/requests/${id}/status`)
        .send({ status: "in_progress" });

      await request(app)
        .patch(`/api/requests/${id}/status`)
        .send({ status: "done" });
    }

    if (from === "rejected") {
      await request(app)
        .patch(`/api/requests/${id}/status`)
        .send({ status: "rejected" });
    }

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: to });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("returns 422 for unknown status", async () => {
    const createResponse = await createRequest(equipmentId);
    const id = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: "unknown" });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
