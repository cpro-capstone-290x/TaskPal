import { sql } from "./config/db.js";

async function resetDB() {
  try {
    // Run DROP and CREATE separately
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        type_of_user VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        unit_no VARCHAR(20),
        street VARCHAR(100),
        city VARCHAR(50),
        province VARCHAR(50),
        postal_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`DROP TABLE IF EXISTS providers CASCADE`;

    await sql`
      CREATE TABLE providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        provider_type VARCHAR(50) NOT NULL,   
        service_type VARCHAR(50) NOT NULL,    
        license_id VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        document TEXT,
        status VARCHAR(20) DEFAULT 'Pending',
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log("✅ Users table reset successfully (Neon)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting DB:", error);
    process.exit(1);
  }
}

resetDB();
