// db.js
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Load the right .env file automatically
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

// Prefer DATABASE_URL if available, otherwise fall back to manual connection vars
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;

export const sql = neon(connectionString);

console.log(
  `✅ Connected to ${
    process.env.NODE_ENV === "production" ? "Production" : "Development"
  } Database`
);
