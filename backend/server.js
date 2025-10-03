import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import authorizeRoutes from './routes/authorizeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import taskChatRoutes from './routes/taskChatRoutes.js';
import { sql } from './config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json()); // Body parser middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Security middleware
app.use(morgan('dev')); // Logging middleware
app.use(express.urlencoded({ extended: true })); // To handle URL-encoded data

app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/authorize", authorizeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks/chat", taskChatRoutes);


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
        await sql`
        CREATE TABLE IF NOT EXISTS providers (
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
        )`;
        await sql`
        CREATE TABLE IF NOT EXISTS authorized_users (
            id SERIAL PRIMARY KEY,
            client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- link to main user
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            relationship VARCHAR(50) NOT NULL,  -- e.g., spouse, child, caregiver
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await sql`
        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await sql`
        CREATE TABLE IF NOT EXISTS pending_registrations (
            id SERIAL PRIMARY KEY,
            role VARCHAR(50) NOT NULL, 
            email VARCHAR(100) NOT NULL,
            payload JSONB NOT NULL,
            twofa_code VARCHAR(255) NOT NULL,
            twofa_expires TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (role, email) -- This constraint will now be valid
        )`;
        await sql`
        CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            task_id int NOT NULL,
            client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL,
            notes TEXT,
            scheduled_date TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;
        await sql`
        CREATE TABLE IF NOT EXISTS negotiations (
            id SERIAL PRIMARY KEY,
            booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            proposed_price DECIMAL(10, 2) NOT NULL,
            final_price DECIMAL(10, 2),
            message TEXT,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;
        await sql`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) NOT NULL,
            priority VARCHAR(50) NOT NULL,
            due_date TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;

        console.log('Database initialized');
    } catch (error) {
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