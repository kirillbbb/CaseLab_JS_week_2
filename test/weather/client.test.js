import { createOpenMeteoClient } from "../../src/clients/weather/openMeteo.client.js";
import { jest } from "@jest/globals";

describe("Open-Meteo client", () => {
  const config = {
    weatherForecastBaseUrl: "https://api.open-meteo.com/v1/forecast",
    weatherRequestTimeoutMs: 5000,
    temperatureUnit: "celsius",
  };

  it("requests forecast using equipment coordinates", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          daily: {
            time: ["2026-09-23"],
            temperature_2m_min: [10],
            temperature_2m_max: [20],
            precipitation_sum: [0],
            wind_speed_10m_max: [20],
          },
        }),
    });

    const client = createOpenMeteoClient(config, {
      fetchImpl,
    });

    const result = await client.getForecast({
      latitude: 56.3269,
      longitude: 44.0059,
      days: 3,
    });

    expect(result).toEqual([
      {
        date: "2026-09-23",
        temperatureMin: 10,
        temperatureMax: 20,
        precipitation: 0,
        windSpeedMax: 20,
      },
    ]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url] = fetchImpl.mock.calls[0];

    expect(url).toBeInstanceOf(URL);
    expect(url.searchParams.get("latitude")).toBe("56.3269");
    expect(url.searchParams.get("longitude")).toBe("44.0059");
    expect(url.searchParams.get("forecast_days")).toBe("3");
    expect(url.searchParams.get("wind_speed_unit")).toBe("kmh");
  });

  it("throws when weather API returns non-success status", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const client = createOpenMeteoClient(config, {
      fetchImpl,
    });

    await expect(
      client.getForecast({
        latitude: 56.3269,
        longitude: 44.0059,
        days: 3,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "WEATHER_API_ERROR",
    });
  });

  it("throws when weather API returns invalid JSON", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "not-json",
    });

    const client = createOpenMeteoClient(config, {
      fetchImpl,
    });

    await expect(
      client.getForecast({
        latitude: 56.3269,
        longitude: 44.0059,
        days: 3,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "WEATHER_API_INVALID_RESPONSE",
    });
  });

  it("throws 503 on network error", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("Network error"));

    const client = createOpenMeteoClient(config, {
      fetchImpl,
    });

    await expect(
      client.getForecast({
        latitude: 56.3269,
        longitude: 44.0059,
        days: 3,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "WEATHER_API_UNAVAILABLE",
    });
  });

  it("throws 503 on timeout", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(
      Object.assign(new Error("Timeout"), {
        name: "AbortError",
      }),
    );

    const client = createOpenMeteoClient(config, {
      fetchImpl,
    });

    await expect(
      client.getForecast({
        latitude: 56.3269,
        longitude: 44.0059,
        days: 3,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "WEATHER_API_TIMEOUT",
    });
  });
});
