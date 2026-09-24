import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment, createRequest } from "../helpers/factories.js";

describe("Equipment business rules", () => {
  it("returns 409 for duplicate serial number", async () => {
    const serialNumber = `DUPLICATE-SERIAL-${Date.now()}`;

    const firstResponse = await createEquipment({
      serialNumber,
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await createEquipment({
      serialNumber,
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.body.error.code).toBe("SERIAL_NUMBER_ALREADY_EXISTS");
  });

  it("returns 409 when deleting equipment with an open request", async () => {
    const equipmentResponse = await createEquipment({
      serialNumber: `OPEN-REQUEST-${Date.now()}`,
    });

    expect(equipmentResponse.statusCode).toBe(201);

    const equipmentId = equipmentResponse.body.data.id;

    const requestResponse = await createRequest(equipmentId, {
      title: "Open maintenance request",
    });

    expect(requestResponse.statusCode).toBe(201);

    const deleteResponse = await request(app).delete(
      `/api/equipment/${equipmentId}`,
    );

    expect(deleteResponse.statusCode).toBe(409);
    expect(deleteResponse.body.error.code).toBe("EQUIPMENT_HAS_OPEN_REQUESTS");
  });

  it("allows deleting equipment without open requests", async () => {
    const equipmentResponse = await createEquipment({
      serialNumber: `NO-OPEN-REQUEST-${Date.now()}`,
    });

    const equipmentId = equipmentResponse.body.data.id;

    const maintenanceResponse = await createRequest(equipmentId, {
      title: "Completed maintenance request",
    });

    expect(maintenanceResponse.statusCode).toBe(201);

    const requestId = maintenanceResponse.body.data.id;

    await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({ status: "in_progress" });

    await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({ status: "done" });

    const deleteResponse = await request(app).delete(
      `/api/equipment/${equipmentId}`,
    );

    expect(deleteResponse.statusCode).toBe(204);
  });
});
