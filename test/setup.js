import { sequelize } from "../src/db/sequelize.js";

afterAll(async () => {
  await sequelize.close();
});
