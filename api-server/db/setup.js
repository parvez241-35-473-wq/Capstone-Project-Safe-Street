import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setup() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  try {
    await pool.query(schema);
    console.log("✅ Database schema created successfully.");
  } catch (err) {
    console.error("❌ Failed to set up database:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setup();
