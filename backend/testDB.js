import { sql } from "./config/db.js";

try {
  const result = await sql`SELECT NOW()`;
  console.log("✅ Connected to Neon! Current time:", result[0].now);
  process.exit(0);
} catch (err) {
  console.error("❌ Connection failed:", err);
  process.exit(1);
}
