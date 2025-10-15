// backend/scripts/test-db.js
import { sql } from "./config/db.js";

try {
  console.log("🔄 Verifying Neon database connection...");
  const result = await sql`SELECT current_database(), inet_server_addr(), inet_server_port()`;
  const db = result[0]?.current_database || "unknown";
  console.log(`✅ Connected successfully to database: ${db}`);
  process.exit(0);
} catch (err) {
  console.error("❌ Failed to connect to database:");
  console.error(err.message);
  process.exit(1);
}
