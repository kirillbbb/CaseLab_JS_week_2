const { execFileSync } = require("node:child_process");
const { Client } = require("pg");
require("dotenv").config();

const cfg = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "caselab",
  user: process.env.DB_USER || "caselab",
  password: process.env.DB_PASSWORD || "caselab",
};

async function main() {
  const client = new Client(cfg);
  await client.connect();
  await client.query("SELECT 1");
  await client.end();

  execFileSync("npx", ["sequelize-cli", "db:migrate"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const check = new Client(cfg);
  await check.connect();
  const { rows } = await check.query(
    "SELECT (SELECT COUNT(*) FROM sites)::int AS sites, (SELECT COUNT(*) FROM users)::int AS users",
  );
  await check.end();

  if (rows[0].sites === 0 || rows[0].users === 0) {
    execFileSync("npx", ["sequelize-cli", "db:seed:all"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
