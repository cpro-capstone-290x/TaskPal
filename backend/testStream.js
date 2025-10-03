import { StreamChat } from "stream-chat";
import dotenv from "dotenv";
dotenv.config();

const client = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

async function test() {
  try {
    const serverHealth = await client.getRateLimits();
    console.log("✅ Connected to Stream successfully:", serverHealth);
  } catch (err) {
    console.error("❌ Stream connection failed:", err.message);
  }
}

test();
