import { sql } from "../config/db.js";
import PDFDocument from "pdfkit";
import { put } from "@vercel/blob";
import fs from "fs";

export const bookTask = async (req, res) => {
  const { client_id, provider_id, notes, scheduled_date, price } = req.body;

  if (!client_id || !provider_id || !scheduled_date) {
    return res
      .status(400)
      .json({ error: "client_id, provider_id, and scheduled_date are required" });
  }

  try {
    // 1️⃣ Create booking
    const [booking] = await sql`
      INSERT INTO bookings (client_id, provider_id, notes, scheduled_date, price)
      VALUES (${client_id}, ${provider_id}, ${notes}, ${scheduled_date}, ${price})
      RETURNING id, client_id, provider_id, scheduled_date, status;
    `;

    // 2️⃣ Initialize empty chat record
    await sql`
      INSERT INTO chat_messages (booking_id, messages)
      VALUES (${booking.id}, '[]'::jsonb)
    `;

        const notificationData = {
      type: 'booking', // This will use the CalendarIcon in the header
      title: 'New Booking Request',
      message: `You have a new request. Notes: ${booking.notes ? booking.notes.substring(0, 30) : 'N/A'}...`,
      booking_id: booking.id
    };
    // Emit to the provider's private notification room
    req.io.to(`user-${booking.provider_id}`).emit('new_booking', notificationData);
    console.log(`🔔 Sent 'new_booking' notification to user ${booking.provider_id}`);

    res.status(201).json({
      message: "✅ Booking created successfully, chat initialized",
      bookingId: booking.id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      scheduled_date: booking.scheduled_date,
      status: booking.status,
      price: booking.price,
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

        const notificationData = {
      type: 'payment', // This will use the DollarIcon
      title: 'Price Updated',
      message: `The provider proposed a new price: $${booking.price}`,
      booking_id: id
    };
    // Emit to the client's private notification room
    req.io.to(`user-${booking.client_id}`).emit('payment_agreed', notificationData);
    console.log(`🔔 Sent 'payment_agreed' notification to user ${booking.client_id}`);

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
    let notificationData = {};
    let notifyTo = null;
    let eventType = 'payment_agreed';
    if (role === "user") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_client = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      // Notify PROVIDER that client agreed
      notifyTo = `user-${updated[0].provider_id}`;
      notificationData = {
        type: 'payment',
        title: 'Client Agreed',
        message: 'The client has agreed to the price.',
        booking_id: updated[0].id
      };

    } else if (role === "provider") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_provider = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      // Notify CLIENT that provider agreed
      notifyTo = `user-${updated[0].client_id}`;
      notificationData = {
        type: 'payment',
        title: 'Provider Agreed',
        message: 'The provider has agreed to the price.',
        booking_id: updated[0].id
      };

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

      if (!confirmed) {
        console.error(`❌ Failed to find booking ${id} for final confirmation.`);
        return res.status(404).json({ error: "Booking not found during final update." });
      }

      const confirmedBooking = confirmed;
      req.io.to(`chat-${id}`).emit("booking_updated", confirmedBooking); // <--- broadcast to both clients
      
      const clientNotification = {
        type: 'booking', // Use CalendarIcon
        title: 'Booking Confirmed!',
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id
      };
      req.io.to(`user-${confirmedBooking.client_id}`).emit('new_booking', clientNotification);

      const providerNotification = {
        type: 'booking',
        title: 'Booking Confirmed!',
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id
      };
      req.io.to(`user-${confirmedBooking.provider_id}`).emit('new_booking', providerNotification);
      console.log(`🔔 Sent 'new_booking' (Confirmed) to client ${confirmedBooking.client_id} and provider ${confirmedBooking.provider_id}`);

      return res.json({ message: "Booking confirmed", booking: confirmedBooking });
    }

    // ✅ Otherwise, still negotiating → notify both sides
    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking); // <--- broadcast to both clients
    
    if (notifyTo) {
      req.io.to(notifyTo).emit(eventType, notificationData);
      console.log(`🔔 Sent '${eventType}' notification to ${notifyTo}`);
    }

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

// controllers/bookingController.js
export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // 1️⃣ Find the booking
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // 2️⃣ Check permissions — only the client or provider can cancel
    if (
      (user.role === "user" && booking.client_id !== user.id) ||
      (user.role === "provider" && booking.provider_id !== user.id)
    ) {
      return res.status(403).json({ error: "Unauthorized to cancel this booking" });
    }

    // 3️⃣ Prevent re-cancelling or cancelling confirmed/completed bookings
    if (["Cancelled", "Completed"].includes(booking.status)) {
      return res.status(400).json({ error: `Booking already ${booking.status}` });
    }

    // 4️⃣ Update status to Cancelled (soft delete)
    const [updatedBooking] = await sql`
      UPDATE bookings
      SET status = 'Cancelled', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    // 5️⃣ Optional: Emit socket notification to the other party
    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking);

    // Notify the other party (client ↔ provider)
    const notifyTo =
      user.role === "user"
        ? `user-${booking.provider_id}`
        : `user-${booking.client_id}`;

    const notificationData = {
      type: "booking",
      title: "Booking Cancelled",
      message: `Booking (ID: ${id}) has been cancelled by the ${user.role}.`,
      booking_id: id
    };

    req.io.to(notifyTo).emit("booking_cancelled", notificationData);

    console.log(`🛑 Booking ${id} cancelled by ${user.role}.`);

    res.json({
      message: "Booking cancelled successfully.",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    res.status(500).json({ error: "Failed to cancel booking." });
  }
};
