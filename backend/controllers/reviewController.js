import { sql } from "../config/db.js";

export const createReview = async (req, res) => {
  try {
    const user = req.user; // ✅ authenticated user from middleware
    const { booking_id, provider_id, rating, comment } = req.body;

    if (!booking_id || !provider_id || !rating) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // ✅ Confirm booking exists AND belongs to this user
    const [booking] = await sql`
      SELECT * FROM bookings 
      WHERE id = ${booking_id} AND client_id = ${user.id};
    `;

    if (!booking) {
      return res.status(403).json({ message: "You cannot review this booking." });
    }

    // ✅ Verify execution is fully completed
    const [execution] = await sql`
      SELECT completedprovider, completedclient
      FROM execution
      WHERE booking_id = ${booking_id};
    `;

    if (
      !execution ||
      execution.completedprovider !== "completed" ||
      execution.completedclient !== "completed"
    ) {
      return res.status(400).json({
        message: "Review allowed only after both provider and client confirm completion.",
      });
    }


    // ✅ Check if review already exists
    const [existing] = await sql`
      SELECT id FROM reviews WHERE booking_id = ${booking_id};
    `;

    if (existing) {
      return res.status(409).json({ message: "You already reviewed this booking." });
    }

    const [newReview] = await sql`
      INSERT INTO reviews (booking_id, client_id, provider_id, rating, comment)
      VALUES (${booking_id}, ${user.id}, ${provider_id}, ${rating}, ${comment})
      RETURNING *;
    `;

    return res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getReviewByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [review] = await sql`
      SELECT * FROM reviews WHERE booking_id = ${bookingId};
    `;

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found for this booking",
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error fetching review by booking:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving review",
    });
  }
};

export const getReviewsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await sql`
      SELECT r.*, 
             u.first_name AS reviewer_name, 
             u.last_name AS reviewer_lastname,
             r.created_at
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

