import { validateEquipmentBody } from "../src/validators/equipment.validator.js";
import { validateRequestQuery } from "../src/validators/request.query.validator.js";

describe("validators", () => {
  test("equipment rejects future installation date", () => {
    const details = validateEquipmentBody({
      name: "Test",
      type: "turbine",
      serialNumber: "SN-1",
      location: { lat: 56, lon: 44 },
      status: "operational",
      installedAt: "2999-01-01T00:00:00.000Z",
    });
    expect(details.some((item) => item.field === "installedAt")).toBe(true);
  });

  test("request query rejects arbitrary sort field", () => {
    const details = validateRequestQuery({ sortBy: "createdAt;DROP TABLE maintenance_requests" });
    expect(details.some((item) => item.field === "sortBy")).toBe(true);
  });
});
