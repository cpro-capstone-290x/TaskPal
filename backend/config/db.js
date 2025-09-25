import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();


//creates a sql connection using our env variables
const { PGUSER, PGPASSWORD, PGHOST, PGDATABASE } = process.env;
export const sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
);

//this sql function we export is used as a tagged template literal, which allows us to write SQL queries in a more readable way