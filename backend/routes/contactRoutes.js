import express from "express";
import { sendContactMessage } from "../config/mailer.js"; // ✅ using directly from mailer.js

const router = express.Router();

router.post("/", sendContactMessage);

export default router;
