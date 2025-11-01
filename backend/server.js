import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
import { protect } from "./middleware/authMiddleware.js";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🧭 Current working dir:", process.cwd());
console.log("📂 server.js location:", __dirname);

try {
  console.log("📂 Folder contents:", fs.readdirSync(__dirname));
} catch (e) {
  console.error("⚠️ Could not read directory:", e.message);
}

// ✅ Allowed Origins (Local + Production)
const allowedOrigins = [
  "http://localhost:5173",
  "https://task-pal-zeta.vercel.app", // your Vercel frontend domain
  "https://taskpal-14oy.onrender.com",
];

// ✅ Middlewares
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

// ✅ Create HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // ✅ ensure fallback support
  allowEIO3: true, // ✅ compatibility for older clients
});


// ✅ Attach io to all requests
app.set("io", io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.urlencoded({ extended: true }));

// ✅ Add this health check route
app.get("/", (req, res) => {
  res.send("🚀 TaskPal backend is live and running successfully!");
});

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/authorize", authorizeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/reviews",  reviewRoutes);
app.use("/api/contact", contactRoutes);

// ✅ SOCKET.IO Logic
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_notification_room", ({ userId }) => {
    const room = `user-${userId}`;
    socket.join(room);
    console.log(`📩 Joined notification room: ${room}`);
  });

  socket.on("join_room", async ({ bookingId }) => {
    const room = `chat-${bookingId}`;
    socket.join(room);
    console.log(`📩 Joined room: ${room}`);

    try {
      // Ensure chat record exists
      await sql`
        INSERT INTO chat_messages (booking_id)
        VALUES (${bookingId})
        ON CONFLICT (booking_id) DO NOTHING;
      `;

      // Fetch existing messages
      const result = await sql`
        SELECT messages FROM chat_messages WHERE booking_id = ${bookingId};
      `;
      let chatHistory = result[0]?.messages || [];

      // Normalize message format
      chatHistory = chatHistory.map((m) => ({
        bookingId,
        sender_id: m.sender_id ?? 0,
        sender_role: m.sender_role ?? "system",
        message: m.message ?? "",
        timestamp: m.timestamp ?? new Date().toISOString(),
      }));

      socket.emit("load_messages", chatHistory);
    } catch (error) {
      console.error("❌ Error loading chat history:", error);
      socket.emit("load_messages", []);
    }
  });

  socket.on("send_message", async (data) => {
    const { bookingId, sender_id, sender_role, message, recipientId } = data;

    const fullMessage = {
      bookingId,
      sender_id,
      sender_role,
      message,
      timestamp: new Date().toISOString(),
    };

    try {
      await sql`
        UPDATE chat_messages
        SET messages = coalesce(messages, '[]'::jsonb) || ${JSON.stringify([fullMessage])}::jsonb,
            updated_at = NOW()
        WHERE booking_id = ${bookingId};
      `;
      console.log("💾 Saved message:", fullMessage);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }

    socket.to(`chat-${bookingId}`).emit("receive_message", fullMessage);

  if (recipientId) {
    const notificationData = {
      type: 'message',
      title: 'New Message',
      message: message.substring(0, 50) + '...'
    };
    io.to(`user-${recipientId}`).emit('new_message', notificationData);
    console.log(`🔔 Sent 'new_message' notification to user ${recipientId}`);
  }
});

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


// ✅ Initialize Database Tables
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
      );
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
        client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        relationship VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

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
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}

// ✅ Start Server
initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💬 Socket.IO active on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
  });
