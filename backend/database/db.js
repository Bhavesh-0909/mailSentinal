const { drizzle } = require("drizzle-orm/node-postgres");
const pkg = require("pg");

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.db = drizzle(pool);