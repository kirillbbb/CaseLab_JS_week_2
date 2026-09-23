export function createWeatherController(weatherService) {
  return {
    async getEquipmentWeather(req, res, next) {
      try {
        const weather = await weatherService.getEquipmentWeather(req.params.id);

        res.status(200).json({
          data: weather,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
