import express from "express";
import { StreamChat } from "stream-chat";

const router = express.Router();

const client = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// Token endpoint
router.post("/token", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const token = client.createToken(userId);
  res.json({ token });
});

export default router;
