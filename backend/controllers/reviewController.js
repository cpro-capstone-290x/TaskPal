import { sql } from "../config/db.js";

export const createReview = async (req, res) => {
  try {
    const { booking_id, client_id, provider_id, rating, comment } = req.body;

    if (!booking_id || !client_id || !provider_id || !rating) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [newReview] = await sql`
      INSERT INTO reviews (booking_id, client_id, provider_id, rating, comment)
      VALUES (${booking_id}, ${client_id}, ${provider_id}, ${rating}, ${comment})
      RETURNING *;
    `;

    return res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};