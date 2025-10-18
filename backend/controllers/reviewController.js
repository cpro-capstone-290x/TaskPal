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

export const getReviewsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await sql`
      SELECT r.*, 
             u.first_name AS reviewer_name, 
             u.last_name AS reviewer_lastname
      FROM reviews r
      LEFT JOIN users u ON r.client_id = u.id
      WHERE r.provider_id = ${providerId}
      ORDER BY r.created_at DESC;
    `;

    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    console.error("Error fetching provider reviews:", err);
    res.status(500).json({ success: false, error: "Failed to fetch provider reviews." });
  }
};