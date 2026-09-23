import { requestJson } from "./http.js";

export function createOpenMeteoClient(config, options = {}) {
  const fetchImpl = options.fetchImpl;

  return {
    async getForecast({ latitude, longitude, days }) {
      const url = new URL(config.weatherForecastBaseUrl);

      url.search = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        daily:
          "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        forecast_days: String(days),
        timezone: "auto",
        temperature_unit: config.temperatureUnit,
        wind_speed_unit: "kmh",
      }).toString();

      const data = await requestJson(url, {
        timeoutMs: config.weatherRequestTimeoutMs,
        fetchImpl,
      });

      return normalizeForecast(data);
    },
  };
}

function normalizeForecast(data) {
  const daily = data?.daily;

  if (
    !daily?.time ||
    !daily?.temperature_2m_min ||
    !daily?.temperature_2m_max ||
    !daily?.precipitation_sum ||
    !daily?.wind_speed_10m_max
  ) {
    throw new Error("Unexpected weather API response");
  }

  return daily.time.map((date, index) => ({
    date,
    temperatureMin: daily.temperature_2m_min[index],
    temperatureMax: daily.temperature_2m_max[index],
    precipitation: daily.precipitation_sum[index],
    windSpeedMax: daily.wind_speed_10m_max[index],
  }));
}
