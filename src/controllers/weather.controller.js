export function createWeatherController(weatherService) {
  return {
    async getEquipmentWeather(req, res, next) {
      try { res.status(200).json({ data: await weatherService.getEquipmentWeather(req.params.id) }); }
      catch (error) { next(error); }
    },
  };
}