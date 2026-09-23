import { createWeatherService } from "../../src/services/weather.service.js";
import { jest } from "@jest/globals";

describe("Weather service", () => {
  const config = {
    weatherForecastDays: 3,
    weatherMaxPrecipitation: 0,
    weatherMaxWindSpeed: 30,
  };

  const equipment = {
    id: "equipment-1",
    location: {
      lat: 56.3269,
      lon: 44.0059,
    },
  };

  function createService(forecast = []) {
    const weatherClient = {
      getForecast: jest.fn().mockResolvedValue(forecast),
    };

    const getEquipmentById = jest.fn().mockReturnValue(equipment);

    const service = createWeatherService({
      weatherClient,
      getEquipmentById,
      config,
    });

    return {
      service,
      weatherClient,
      getEquipmentById,
    };
  }

  it("returns forecast and calculates outdoor work suitability", async () => {
    const forecast = [
      {
        date: "2026-09-23",
        temperatureMin: 10,
        temperatureMax: 20,
        precipitation: 0,
        windSpeedMax: 20,
      },
      {
        date: "2026-09-24",
        temperatureMin: 8,
        temperatureMax: 17,
        precipitation: 5,
        windSpeedMax: 20,
      },
      {
        date: "2026-09-25",
        temperatureMin: 7,
        temperatureMax: 15,
        precipitation: 0,
        windSpeedMax: 35,
      },
    ];

    const { service } = createService(forecast);

    const result = await service.getEquipmentWeather("equipment-1");

    expect(result).toEqual({
      equipmentId: "equipment-1",
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
        {
          ...forecast[1],
          suitableForOutdoorWork: false,
        },
        {
          ...forecast[2],
          suitableForOutdoorWork: false,
        },
      ],
    });
  });

  it("passes equipment coordinates and configured number of days to weather client", async () => {
    const { service, weatherClient } = createService();

    await service.getEquipmentWeather("equipment-1");

    expect(weatherClient.getForecast).toHaveBeenCalledWith({
      latitude: 56.3269,
      longitude: 44.0059,
      days: 3,
    });
  });

  it("uses configured precipitation and wind thresholds", async () => {
    const forecast = [
      {
        date: "2026-09-23",
        temperatureMin: 10,
        temperatureMax: 20,
        precipitation: 2,
        windSpeedMax: 40,
      },
    ];

    const weatherClient = {
      getForecast: jest.fn().mockResolvedValue(forecast),
    };

    const getEquipmentById = jest.fn().mockReturnValue(equipment);

    const service = createWeatherService({
      weatherClient,
      getEquipmentById,
      config: {
        weatherForecastDays: 3,
        weatherMaxPrecipitation: 2,
        weatherMaxWindSpeed: 40,
      },
    });

    const result = await service.getEquipmentWeather("equipment-1");

    expect(result.forecast[0].suitableForOutdoorWork).toBe(false);
  });

  it("marks a day as unsuitable when precipitation exceeds the threshold", async () => {
    const forecast = [
      {
        date: "2026-09-23",
        temperatureMin: 10,
        temperatureMax: 20,
        precipitation: 0.1,
        windSpeedMax: 10,
      },
    ];

    const { service } = createService(forecast);

    const result = await service.getEquipmentWeather("equipment-1");

    expect(result.forecast[0].suitableForOutdoorWork).toBe(false);
  });

  it("marks a day as unsuitable when wind reaches the threshold", async () => {
    const forecast = [
      {
        date: "2026-09-23",
        temperatureMin: 10,
        temperatureMax: 20,
        precipitation: 0,
        windSpeedMax: 30,
      },
    ];

    const { service } = createService(forecast);

    const result = await service.getEquipmentWeather("equipment-1");

    expect(result.forecast[0].suitableForOutdoorWork).toBe(false);
  });

  it("propagates errors from weather client", async () => {
    const weatherError = new Error("Weather API unavailable");

    const weatherClient = {
      getForecast: jest.fn().mockRejectedValue(weatherError),
    };

    const getEquipmentById = jest.fn().mockReturnValue(equipment);

    const service = createWeatherService({
      weatherClient,
      getEquipmentById,
      config,
    });

    await expect(service.getEquipmentWeather("equipment-1")).rejects.toThrow(
      "Weather API unavailable",
    );
  });
});
