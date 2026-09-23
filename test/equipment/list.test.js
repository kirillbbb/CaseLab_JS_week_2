import request from "supertest";

import { app } from "../helpers/app.js";
import { createEquipment } from "../helpers/factories.js";

describe("Equipment list", () => {
  it("returns equipment list with pagination metadata", async () => {
    const response = await request(app).get("/api/equipment");

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

  it("filters by type", async () => {
    const type = `sensor`;

    await createEquipment({
      type,
      serialNumber: `LIST-TYPE-${Date.now()}`,
    });

    const response = await request(app).get(`/api/equipment?type=${type}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.data.every((item) => item.type === type)).toBe(true);
  });

  it("filters by status", async () => {
    await createEquipment({
      status: "maintenance",
      serialNumber: `LIST-STATUS-${Date.now()}`,
    });

    const response = await request(app).get(
      "/api/equipment?status=maintenance",
    );

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.every((item) => item.status === "maintenance"),
    ).toBe(true);
  });

  it("sorts equipment by name ascending", async () => {
    await createEquipment({
      name: "AAA Equipment",
      serialNumber: `LIST-SORT-A-${Date.now()}`,
    });

    await createEquipment({
      name: "ZZZ Equipment",
      serialNumber: `LIST-SORT-Z-${Date.now()}`,
    });

    const response = await request(app).get(
      "/api/equipment?sortBy=name&sortOrder=asc",
    );

    expect(response.statusCode).toBe(200);

    const names = response.body.data.map((item) => item.name);

    expect(names).toEqual([...names].sort());
  });

  it("sorts equipment by name descending", async () => {
    await createEquipment({
      name: "AAA Desc Equipment",
      serialNumber: `LIST-SORT-DESC-A-${Date.now()}`,
    });

    await createEquipment({
      name: "ZZZ Desc Equipment",
      serialNumber: `LIST-SORT-DESC-Z-${Date.now()}`,
    });

    const response = await request(app).get(
      "/api/equipment?sortBy=name&sortOrder=desc",
    );

    expect(response.statusCode).toBe(200);

    const names = response.body.data.map((item) => item.name);

    expect(names).toEqual([...names].sort().reverse());
  });

  it("paginates equipment", async () => {
    const suffix = Date.now();

    for (let index = 0; index < 3; index += 1) {
      const response = await createEquipment({
        serialNumber: `LIST-PAGE-${suffix}-${index}`,
      });

      expect(response.statusCode).toBe(201);
    }

    const firstPage = await request(app).get("/api/equipment?limit=2&page=1");

    const secondPage = await request(app).get("/api/equipment?limit=2&page=2");

    expect(firstPage.statusCode).toBe(200);
    expect(secondPage.statusCode).toBe(200);

    expect(firstPage.body.data).toHaveLength(2);
    expect(secondPage.body.data.length).toBeGreaterThanOrEqual(1);
    expect(firstPage.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it("returns an empty list for a page beyond available data", async () => {
    const response = await request(app).get("/api/equipment?page=999&limit=20");

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.page).toBe(999);
    expect(response.body.meta.limit).toBe(20);
  });
});
