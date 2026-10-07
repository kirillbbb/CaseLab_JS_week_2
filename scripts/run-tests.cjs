const { execFileSync } = require("node:child_process");
const { spawnSync } = require("node:child_process");
const { Client } = require("pg");
const path = require("node:path");

const env = {
  ...process.env,
  NODE_ENV: "test",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  DB_NAME: "caselab_test",
  DB_USER: process.env.DB_USER || "caselab",
  DB_PASSWORD: process.env.DB_PASSWORD || "caselab",
  JWT_SECRET: process.env.JWT_SECRET || "test-secret-for-tests",
};

const adminConfig = {
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: "postgres",
  user: env.DB_USER,
  password: env.DB_PASSWORD,
};

const testConfig = {
  ...adminConfig,
  database: env.DB_NAME,
};

async function recreateTestDatabase() {
  const admin = new Client(adminConfig);
  await admin.connect();

  await admin.query('DROP DATABASE IF EXISTS "caselab_test" WITH (FORCE)');
  await admin.query('CREATE DATABASE "caselab_test"');

  await admin.end();
}

async function createTestSite() {
  const client = new Client(testConfig);
  await client.connect();

  await client.query(
    `INSERT INTO sites
      (id, name, code, region, latitude, longitude, created_at, updated_at)
     VALUES
      ('60000000-0000-4000-8000-000000000001',
       'Test Site',
       'TEST-01',
       'Test',
       56.3269,
       44.0059,
       NOW(),
       NOW())
     ON CONFLICT (id) DO NOTHING`,
  );

  await client.end();
}

function run(command, args) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  execFileSync(executable, args, { stdio: "inherit", env });
}

async function main() {
  await recreateTestDatabase();

  run("npx", ["sequelize-cli", "db:migrate"]);
  await createTestSite();

  const jestPath = path.resolve("node_modules/jest/bin/jest.js");
  const result = spawnSync(
    process.execPath,
    ["--experimental-vm-modules", jestPath, "--runInBand", ...process.argv.slice(2)],
    { stdio: "inherit", env },
  );

  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error("Test database setup failed:", error);
  process.exit(1);
});
