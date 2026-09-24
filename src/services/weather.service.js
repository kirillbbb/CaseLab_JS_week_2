import { getEquipmentById as defaultGetEquipmentById } from "./equipment.service.js";

export function createWeatherService({
  weatherClient,
  config,
  getEquipmentById = defaultGetEquipmentById,
}) {
  return {
    async getEquipmentWeather(equipmentId) {
      const equipment = getEquipmentById(equipmentId);

      const forecast = await weatherClient.getForecast({
        latitude: equipment.location.lat,
        longitude: equipment.location.lon,
        days: config.weatherForecastDays,
      });

      const criteria = {
        maxPrecipitation: config.weatherMaxPrecipitation,
        maxWindSpeed: config.weatherMaxWindSpeed,
      };

      const forecastWithSuitability = forecast.map((day) => ({
        ...day,
        suitableForOutdoorWork:
          day.precipitation <= criteria.maxPrecipitation &&
          day.windSpeedMax < criteria.maxWindSpeed,
      }));

      return {
        equipmentId: equipment.id,
        location: equipment.location,
        criteria,
        forecast: forecastWithSuitability,
      };
    },
  };
}
