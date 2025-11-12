// backend/routes/accessibilityRoutes.js
import express from "express";
import { sql } from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Keep font size within a sane range (80–200), default 100
const clampFont = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 100;
  return Math.min(200, Math.max(80, Math.round(x)));
};

// GET /api/accessibility/me  (normal users only)
router.get("/me", protect, async (req, res) => {
  if (!req.user || req.user.role !== "user") {
    return res
      .status(403)
      .json({ error: "Accessibility settings are only available for user accounts." });
  }

  // prevent caches from returning 304/no body
  res.set("Cache-Control", "no-store");

  try {
    const { id: userId } = req.user;
    const rows = await sql`
      SELECT font_size, readable_font, spacing
      FROM public.accessibility_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.json({ fontSize: 100, readableFont: false, spacing: false });
    }

    const r = rows[0];
    return res.json({
      fontSize: r.font_size,
      readableFont: r.readable_font,
      spacing: r.spacing,
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to load accessibility settings" });
  }
});

// PATCH /api/accessibility  (normal users only)
router.patch("/", protect, async (req, res) => {
  if (!req.user || req.user.role !== "user") {
    return res
      .status(403)
      .json({ error: "Accessibility settings are only available for user accounts." });
  }

  // prevent caches from reusing/storing this response
  res.set("Cache-Control", "no-store");

  const { id: userId } = req.user;
  const { fontSize, readableFont, spacing } = req.body ?? {};

  const fs = clampFont(fontSize ?? 100);
  const rf = !!readableFont;
  const sp = !!spacing;

  try {
    await sql`
      INSERT INTO public.accessibility_settings (user_id, font_size, readable_font, spacing)
      VALUES (${userId}, ${fs}, ${rf}, ${sp})
      ON CONFLICT (user_id)
      DO UPDATE SET font_size = EXCLUDED.font_size,
                    readable_font = EXCLUDED.readable_font,
                    spacing = EXCLUDED.spacing
    `;

    return res.json({ fontSize: fs, readableFont: rf, spacing: sp });
  } catch (e) {
    return res.status(500).json({ error: "Failed to save accessibility settings" });
  }
});

export default router;
