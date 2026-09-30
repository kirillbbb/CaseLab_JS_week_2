import { sequelize } from "./sequelize.js";

export async function assertDatabaseConnection() {
  try {
    await sequelize.authenticate();
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}