import { put } from "@vercel/blob";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/test-upload", async (req, res) => {
  try {
    const { url } = await put("Client-Provider-Agreement/test.txt", "Hello Blob!", {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    res.json({ success: true, url });
  } catch (err) {
    console.error("❌ Upload test failed:", err);
    res.status(500).json({ error: err.message });
  }
});
