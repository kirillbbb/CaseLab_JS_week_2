require("dotenv").config();

module.exports = {
  development: {
    dialect: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "caselab",
    username: process.env.DB_USER || "caselab",
    password: process.env.DB_PASSWORD || "caselab",
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
  },
  test: {
    dialect: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "caselab_test",
    username: process.env.DB_USER || "caselab",
    password: process.env.DB_PASSWORD || "caselab",
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  },
  production: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
  },
};