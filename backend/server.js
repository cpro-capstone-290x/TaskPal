import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { sql } from './config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json()); // Body parser middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Security middleware
app.use(morgan('dev')); // Logging middleware

app.use("/api/users", userRoutes);

async function initDB() {
    try {
        await sql`
        CREATE TABLE IF NOT EXISTS users (
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

        console.log('Database initialized');}
        catch (error) {
        console.error('Error initializing database:', error);           
    }
};

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    }); 
}).catch((error) => {
    console.error('Failed to start server:', error);
});