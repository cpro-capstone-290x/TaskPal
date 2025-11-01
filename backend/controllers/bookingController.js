import { sql } from "../config/db.js";
import PDFDocument from "pdfkit";
import { put } from "@vercel/blob";
import fs from "fs";

export const bookTask = async (req, res) => {
  const { client_id, provider_id, notes, scheduled_date } = req.body;

  if (!client_id || !provider_id || !scheduled_date) {
    return res
      .status(400)
      .json({ error: "client_id, provider_id, and scheduled_date are required" });
  }

  try {
    // 1️⃣ Create booking
    const [booking] = await sql`
      INSERT INTO bookings (client_id, provider_id, notes, scheduled_date)
      VALUES (${client_id}, ${provider_id}, ${notes}, ${scheduled_date})
      RETURNING id, client_id, provider_id, scheduled_date, status;
    `;

    // 2️⃣ Initialize empty chat record
    await sql`
      INSERT INTO chat_messages (booking_id, messages)
      VALUES (${booking.id}, '[]'::jsonb)
    `;

    res.status(201).json({
      message: "✅ Booking created successfully, chat initialized",
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

    const user = req.user;

    // 🧠 Role-based access control
    if (user.role === "user" && booking.client_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    if (user.role === "provider" && booking.provider_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    // Admins can view all
    return res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    return res.status(500).json({ error: "Server error" });
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

    // ✅ Generate PDF in memory
    const PDFBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument();

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

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
      doc.end();
    });

// ✅ Upload PDF to Vercel Blob (safe overwrite)
const blobPath = `Client-Provider-Agreement/agreement_booking_${id}.pdf`;

const upload = await put(blobPath, PDFBuffer, {
  access: "public",
  contentType: "application/pdf",
  token: process.env.BLOB_READ_WRITE_TOKEN,
  allowOverwrite: true, // ✅ correct placement for v2.x
});

console.log("✅ Uploaded to Blob:", upload.url);

// ✅ Save the Blob URL to the bookings table
await sql`
  UPDATE bookings
  SET agreement_pdf_url = ${upload.url}, updated_at = NOW()
  WHERE id = ${id};
`;

console.log("💾 Saved agreement URL to DB for booking:", id);

// ✅ Return JSON response
res.status(200).json({
  success: true,
  message: "Agreement uploaded successfully to Vercel Blob",
  url: upload.url,
});

  } catch (err) {
    console.error("❌ Error generating/downloading agreement:", err);
    res.status(500).json({ error: "Failed to generate/download agreement" });
  }
};
