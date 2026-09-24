import crypto from "node:crypto";
import request from "supertest";

import { createApp } from "../../src/app.js";
import { jest } from "@jest/globals";
import { AppError } from "../../src/errors/AppError.js";

describe("GET /api/equipment/:id/weather", () => {
  const config = {
    nodeEnv: "test",
    port: 3000,
    corsOrigin: "http://localhost:3000",
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
    bodyLimit: "100kb",
    apiKey: "",
    logLevel: "silent",

    weatherForecastDays: 3,
    weatherMaxPrecipitation: 0,
    weatherMaxWindSpeed: 30,
    weatherForecastBaseUrl: "https://api.open-meteo.com/v1/forecast",
    weatherRequestTimeoutMs: 5000,
    temperatureUnit: "celsius",
  };

  const forecast = [
    {
      date: "2026-09-23",
      temperatureMin: 10,
      temperatureMax: 20,
      precipitation: 0,
      windSpeedMax: 20,
    },
  ];

  function createTestApp(weatherClient) {
    return createApp(config, {
      weatherClient,
    });
  }

  async function createEquipment(app, overrides = {}) {
    return request(app)
      .post("/api/equipment")
      .send({
        name: "Weather Test Equipment",
        type: "turbine",
        serialNumber: `WEATHER-${crypto.randomUUID()}`,
        location: {
          lat: 56.3269,
          lon: 44.0059,
        },
        status: "operational",
        installedAt: "2025-01-01T00:00:00.000Z",
        ...overrides,
      });
  }

  it("returns weather forecast for equipment", async () => {
    const weatherClient = {
      getForecast: jest.fn().mockResolvedValue(forecast),
    };

    const app = createTestApp(weatherClient);

    const equipmentResponse = await createEquipment(app);

    expect(equipmentResponse.statusCode).toBe(201);

    const equipmentId = equipmentResponse.body.data.id;

    const response = await request(app).get(
      `/api/equipment/${equipmentId}/weather`,
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.data).toEqual({
      equipmentId,
      location: {
        lat: 56.3269,
        lon: 44.0059,
      },
      criteria: {
        maxPrecipitation: 0,
        maxWindSpeed: 30,
      },
      forecast: [
        {
          ...forecast[0],
          suitableForOutdoorWork: true,
        },
      ],
    });

    expect(weatherClient.getForecast).toHaveBeenCalledWith({
      latitude: 56.3269,
      longitude: 44.0059,
      days: 3,
    });
  });

  it("returns 404 when equipment does not exist", async () => {
    const weatherClient = {
      getForecast: jest.fn(),
    };

    const app = createTestApp(weatherClient);

    const response = await request(app).get(
      "/api/equipment/non-existent-equipment/weather",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("EQUIPMENT_NOT_FOUND");

    expect(weatherClient.getForecast).not.toHaveBeenCalled();
  });

  it("returns 503 when weather API is unavailable", async () => {
    const weatherClient = {
      getForecast: jest
        .fn()
        .mockRejectedValue(
          new AppError(
            503,
            "WEATHER_API_UNAVAILABLE",
            "Weather API is unavailable",
          ),
        ),
    };

    const app = createTestApp(weatherClient);

    const equipmentResponse = await createEquipment(app);

    const equipmentId = equipmentResponse.body.data.id;

    const response = await request(app).get(
      `/api/equipment/${equipmentId}/weather`,
    );

    expect(response.statusCode).toBe(503);
  });

  it("returns 503 when weather API request times out", async () => {
    const weatherClient = {
      getForecast: jest
        .fn()
        .mockRejectedValue(
          new AppError(
            503,
            "WEATHER_API_TIMEOUT",
            "Weather API request timed out",
          ),
        ),
    };

    const app = createTestApp(weatherClient);

    const equipmentResponse = await createEquipment(app);

    const equipmentId = equipmentResponse.body.data.id;

    const response = await request(app).get(
      `/api/equipment/${equipmentId}/weather`,
    );

    expect(response.statusCode).toBe(503);
  });
});
