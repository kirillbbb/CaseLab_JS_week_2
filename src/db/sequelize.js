import { Sequelize } from "sequelize";

import { loadConfig } from "../config/env.js";

const config = loadConfig();

export const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: false,
    pool: config.db.pool,
  },
);