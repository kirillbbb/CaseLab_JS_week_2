import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Requests business rules", () => {
  let equipmentId;

  beforeAll(async () => {
    const response = await createEquipment({
      serialNumber: "REQUEST-BUSINESS-EQUIPMENT-001",
    });

    expect(response.statusCode).toBe(201);

    equipmentId = response.body.data.id;
  });

  it("returns requests for equipment", async () => {
    await createRequest(equipmentId);

    const response = await request(app).get(
      `/api/equipment/${equipmentId}/requests`,
    );

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("meta");

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
});
