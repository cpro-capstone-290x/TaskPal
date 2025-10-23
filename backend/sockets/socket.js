import { Server } from "socket.io";
import { sql } from "../config/db.js";
import jwt from "jsonwebtoken";

/**
 * Initializes Socket.IO and attaches event listeners for chat communication.
 * - Persists messages in the `chat_messages` table (JSONB).
 * - Allows clients to chat immediately.
 * - Requires JWT for providers to join.
 */
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // ✅ JOIN ROOM
    socket.on("join_room", async ({ bookingId, role, token }) => {
      try {
        // Providers must have a valid JWT
        if (role === "provider") {
          if (!token) throw new Error("Unauthorized: Missing token");
          jwt.verify(token, process.env.JWT_SECRET);
        }

        socket.join(`chat-${bookingId}`);

        // Load stored messages
        const [chat] = await sql`
          SELECT messages FROM chat_messages WHERE booking_id = ${bookingId};
        `;
        const history = chat ? chat.messages : [];

        socket.emit("load_messages", history);
        console.log(`📨 ${role} joined chat-${bookingId}`);
      } catch (err) {
        console.error("❌ Join error:", err.message);
        socket.emit("error_message", "Unauthorized or invalid access");
      }
    });

    // ✅ RECEIVE & SAVE MESSAGE
    socket.on("send_message", async (data) => {
      const { bookingId, senderId, senderRole, message } = data;
      const timestamp = new Date().toISOString();

      const newMessage = {
        sender_id: senderId,
        sender_role: senderRole,
        message,
        timestamp,
      };

      try {
        // Append to JSON array
        await sql`
          UPDATE chat_messages
          SET messages = messages || ${JSON.stringify([newMessage])}::jsonb,
              updated_at = NOW()
          WHERE booking_id = ${bookingId};
        `;

        io.to(`chat-${bookingId}`).emit("receive_message", newMessage);
      } catch (err) {
        console.error("❌ Error saving message:", err.message);
        socket.emit("error_message", "Failed to save message");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
};
