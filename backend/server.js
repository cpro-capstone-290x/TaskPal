import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import authorizeRoutes from "./routes/authorizeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoute.js";
import executionRoutes from "./routes/executionRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { sql } from "./config/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Create HTTP + Socket.IO server FIRST
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
  },
});

// ✅ Attach io to all incoming requests BEFORE routes
app.set("io", io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/authorize", authorizeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);

// ✅ SOCKET.IO LOGIC
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.on("join_room", async ({ bookingId, userId }) => {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${bookingId}`;
    if (!booking) {
      socket.emit("error", "Booking not found");
      return;
    }
    const room = `chat-${bookingId}`;
    socket.join(room);
    console.log(`✅ User ${userId} joined room: ${room}`);
  });

  socket.on("send_message", ({ bookingId, senderId, message }) => {
    const room = `chat-${bookingId}`;
    console.log(`📩 Message from ${senderId} in ${room}: ${message}`);
    io.to(room).emit("receive_message", {
      senderId,
      message,
      timestamp: new Date(),
    });
  });

  socket.on("leave_all_rooms", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.leave(room);
    }
  });
});

// ✅ Initialize database tables
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
    )`;
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
        rejection_reason TEXT, 
        password VARCHAR(255) NOT NULL,       
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    

        // 🚨 MIGRATION FIX: Add rejection_reason column if it doesn't exist 🚨
        try {
             await sql`
                 ALTER TABLE providers
                 ADD COLUMN rejection_reason TEXT
             `;
             console.log("✅ Migration: Added 'rejection_reason' to providers table.");
         } catch (e) {
             // We expect this to fail if the column already exists, which is fine.
             // If it fails for another reason, we still want the other tables to try to initialize.
             if (!e.message.includes('column "rejection_reason" already exists')) {
                 console.error("⚠️ Migration Warning: Could not add 'rejection_reason' column:", e.message);
             }
         }

    await sql`
    CREATE TABLE IF NOT EXISTS authorized_users (
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
        UNIQUE (role, email)
    )`;
    await sql`
    CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        notes TEXT,
        scheduled_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql`
    CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}

// Start server
initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`💬 Socket.IO active on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
  });
