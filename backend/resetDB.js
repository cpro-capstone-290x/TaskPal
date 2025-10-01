import { sql } from "./config/db.js";

async function resetDB() {
  try {
    // DROP and CREATE USERS
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
        twofa_code VARCHAR(6),
        twofa_expires TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // DROP and CREATE PROVIDERS
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
        twofa_code VARCHAR(6),
        twofa_expires TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // DROP and CREATE AUTHORIZED USERS
    await sql`DROP TABLE IF EXISTS authorized_users CASCADE`;
    await sql`
      CREATE TABLE authorized_users (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        relationship VARCHAR(50) NOT NULL, 
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // DROP and CREATE ADMINS
    await sql`DROP TABLE IF EXISTS admins CASCADE`;
    await sql`
      CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        twofa_code VARCHAR(6),
        twofa_expires TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`DROP TABLE IF EXISTS pending_registrations`;
    await sql`
    CREATE TABLE IF NOT EXISTS pending_registrations (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL, -- 👈 Add this line
        email VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        twofa_code VARCHAR(255) NOT NULL,
        twofa_expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (role, email) -- This constraint will now be valid
      )
    `;
    
    console.log("✅ All tables reset successfully (with 2FA columns)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting DB:", error);
    process.exit(1);
  }
}

resetDB();
