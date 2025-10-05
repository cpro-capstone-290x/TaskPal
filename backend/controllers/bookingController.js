import { sql } from "../config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";

export const bookTask = async (req, res) => {
  const { client_id, provider_id, notes, scheduled_date } = req.body;

  // Basic validation
  if (!client_id || !provider_id || !scheduled_date) {
    return res
      .status(400)
      .json({ error: "client_id, provider_id, and scheduled_date are required" });
  }

  try {
    const [booking] = await sql`
      INSERT INTO bookings (client_id, provider_id, notes, scheduled_date)
      VALUES (${client_id}, ${provider_id}, ${notes}, ${scheduled_date})
      RETURNING id, client_id, provider_id, scheduled_date, status;
    `;

    res.status(201).json({
      message: "✅ Booking created successfully",
      bookingId: booking.id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      scheduled_date: booking.scheduled_date,
      status: booking.status,
    });
  } catch (err) {
    console.error("❌ Booking creation error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update booking price (provider)
export const updateBookingPrice = async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  try {
    const [booking] = await sql`
      UPDATE bookings
      SET price = ${price}, status = 'Negotiating', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // ✅ Broadcast to both client and provider via chat room
    req.io.to(`chat-${id}`).emit("booking_updated", booking);

    res.json({ message: "Price updated successfully", booking });
  } catch (err) {
    console.error("Error updating price:", err);
    res.status(500).json({ error: "Failed to update price" });
  }
};


// Client or Provider agrees
export const agreeToPrice = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    let updated;
    if (role === "user") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_client = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
    } else if (role === "provider") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_provider = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedBooking = updated[0];

    // ✅ If both sides agreed → Confirm booking
    if (
      updatedBooking.agreement_signed_by_client &&
      updatedBooking.agreement_signed_by_provider
    ) {
      const [confirmed] = await sql`
        UPDATE bookings
        SET status = 'Confirmed', updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      req.io.to(`chat-${id}`).emit("booking_updated", confirmed[0]); // <--- broadcast to both clients
      return res.json({ message: "Booking confirmed", booking: confirmed[0] });
    }

    // ✅ Otherwise, still negotiating → notify both sides
    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking); // <--- broadcast to both clients
    res.json({ message: "Agreement updated", booking: updatedBooking });
  } catch (err) {
    console.error("❌ Error updating agreement:", err);
    res.status(500).json({ error: "Failed to update agreement" });
  }
};

export const downloadAgreement = async (req, res) => {
  const { id } = req.params;

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    // ✅ Ensure both sides agreed
    if (
      !booking.agreement_signed_by_client ||
      !booking.agreement_signed_by_provider
    ) {
      res
        .status(400)
        .json({ error: "Agreement not yet signed by both parties" });
      return;
    }

    // ✅ Prepare data safely
    const price =
      booking.price && !isNaN(booking.price)
        ? parseFloat(booking.price).toFixed(2)
        : "Not specified";

    const scheduledDate = booking.scheduled_date
      ? new Date(booking.scheduled_date).toLocaleString()
      : "Not scheduled";

    // ✅ Configure response headers before writing
    const filename = `agreement_booking_${id}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    // ✅ Stream PDF to response
    const doc = new PDFDocument();
    doc.pipe(res);

    // --- HEADER
    doc.fontSize(22).text("TaskPal Service Agreement", { align: "center" });
    doc.moveDown(2);

    // --- BOOKING DETAILS
    doc.fontSize(14).text("Booking Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Booking ID: ${booking.id}`);
    doc.text(`Client ID: ${booking.client_id}`);
    doc.text(`Provider ID: ${booking.provider_id}`);
    doc.text(`Notes: ${booking.notes || "N/A"}`);
    doc.text(`Price: $${price}`);
    doc.text(`Scheduled Date: ${scheduledDate}`);
    doc.text(`Status: ${booking.status}`);
    doc.moveDown(1.5);

    // --- AGREEMENT TERMS
    doc.fontSize(14).text("Agreement Terms", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(
      "This document confirms that both parties have reviewed and agreed to the TaskPal Terms & Conditions. " +
        "Once signed, the provider commits to fulfilling the service as described, and the client agrees to pay the stated price."
    );
    doc.moveDown(1.5);

    // --- SIGNATURE SECTION
    doc.text("___________________________", { continued: true }).text("     ", {
      continued: true,
    });
    doc.text("___________________________");
    doc.text("Client Signature", { continued: true }).text("               ");
    doc.text("Provider Signature");
    doc.moveDown(2);

    doc.text("Digitally signed via TaskPal Platform.", { align: "center" });

    // ✅ Properly end the document
    doc.end();
  } catch (err) {
    console.error("❌ Error generating agreement:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate agreement" });
    }
  }
};