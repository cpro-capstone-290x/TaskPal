// controllers/bookingController.js
import { sql } from "../config/db.js";
import PDFDocument from "pdfkit";
import { put } from "@vercel/blob";
import fs from "fs";

// 🔥 Helper to save notifications to DB
async function saveNotification({ userId, type, title, message, bookingId }) {
  try {
    await sql`
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${bookingId})
    `;
  } catch (err) {
    console.error("❌ Failed to save notification:", err);
  }
}

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
      RETURNING *, notes;
    `;

    // 2️⃣ Initialize empty chat record
    await sql`
      INSERT INTO chat_messages (booking_id, messages)
      VALUES (${booking.id}, '[]'::jsonb)
    `;

    // 3️⃣ Socket notification
    const notificationData = {
      type: "booking",
      title: "New Booking Request",
      message: `You have a new request. Notes: ${booking.notes ? booking.notes.substring(0, 30) : "N/A"}...`,
      booking_id: booking.id,
    };

    req.io.to(`user-${booking.provider_id}`).emit("new_booking", notificationData);
    console.log(`🔔 Sent 'new_booking' notification to user ${booking.provider_id}`);

    // 4️⃣ Persistent DB notification
    await saveNotification({
      userId: booking.provider_id,
      type: "booking",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: booking.id,
    });

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

    if (user.role === "user" && booking.client_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    if (user.role === "provider" && booking.provider_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    return res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

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

    req.io.to(`chat-${id}`).emit("booking_updated", booking);

    const notificationData = {
      type: "payment",
      title: "Price Updated",
      message: `The provider proposed a new price: $${booking.price}`,
      booking_id: id,
    };

    // Socket notify user
    req.io.to(`user-${booking.client_id}`).emit("payment_agreed", notificationData);
    console.log(`🔔 Sent 'payment_agreed' notification to user ${booking.client_id}`);

    // Persistent notify
    await saveNotification({
      userId: booking.client_id,
      type: "payment",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: id,
    });

    res.json({ message: "Price updated successfully", booking });
  } catch (err) {
    console.error("Error updating price:", err);
    res.status(500).json({ error: "Failed to update price" });
  }
};

export const agreeToPrice = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    let updated;
    let notificationData = {};
    let notifyTo = null;
    let notifyUserId = null;

    if (role === "user") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_client = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      notifyTo = `user-${updated[0].provider_id}`;
      notifyUserId = updated[0].provider_id;
      notificationData = {
        type: "payment",
        title: "Client Agreed",
        message: "The client has agreed to the price.",
        booking_id: updated[0].id,
      };
    } else if (role === "provider") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_provider = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      notifyTo = `user-${updated[0].client_id}`;
      notifyUserId = updated[0].client_id;
      notificationData = {
        type: "payment",
        title: "Provider Agreed",
        message: "The provider has agreed to the price.",
        booking_id: updated[0].id,
      };
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedBooking = updated[0];

    // 🔥 Persistent notify
    await saveNotification({
      userId: notifyUserId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      bookingId: updatedBooking.id,
    });

    // 🔥 Socket notify
    req.io.to(notifyTo).emit("payment_agreed", notificationData);

    // If both agreed → Confirm booking
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

      const confirmedBooking = confirmed;

      req.io.to(`chat-${id}`).emit("booking_updated", confirmedBooking);

      const clientNotification = {
        type: "booking",
        title: "Booking Confirmed!",
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id,
      };
      req.io.to(`user-${confirmedBooking.client_id}`).emit("new_booking", clientNotification);

      const providerNotification = {
        type: "booking",
        title: "Booking Confirmed!",
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id,
      };
      req.io.to(`user-${confirmedBooking.provider_id}`).emit("new_booking", providerNotification);

      // 🔥 Persistent for both client + provider
      await saveNotification({
        userId: confirmedBooking.client_id,
        type: "booking",
        title: clientNotification.title,
        message: clientNotification.message,
        bookingId: confirmedBooking.id,
      });
      await saveNotification({
        userId: confirmedBooking.provider_id,
        type: "booking",
        title: providerNotification.title,
        message: providerNotification.message,
        bookingId: confirmedBooking.id,
      });

      return res.json({ message: "Booking confirmed", booking: confirmedBooking });
    }

    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking);

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
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (!booking.agreement_signed_by_client || !booking.agreement_signed_by_provider) {
      return res.status(400).json({ error: "Agreement not fully signed" });
    }

    const price =
      booking.price && !isNaN(booking.price)
        ? parseFloat(booking.price).toFixed(2)
        : "Not specified";

    const scheduledDate = booking.scheduled_date
      ? new Date(booking.scheduled_date).toLocaleString()
      : "Not scheduled";

    const PDFBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument();

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(22).text("TaskPal Service Agreement", { align: "center" });
      doc.moveDown(2);

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

      doc.fontSize(14).text("Agreement Terms", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(
        "This confirms that both parties have reviewed and agreed to the TaskPal Terms & Conditions. " +
          "The provider commits to fulfill the service and the client agrees to pay the price stated."
      );
      doc.moveDown(1.5);

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

    const blobPath = `Client-Provider-Agreement/agreement_booking_${id}.pdf`;

    const upload = await put(blobPath, PDFBuffer, {
      access: "public",
      contentType: "application/pdf",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true,
    });

    await sql`
      UPDATE bookings
      SET agreement_pdf_url = ${upload.url}, updated_at = NOW()
      WHERE id = ${id};
    `;

    res.status(200).json({
      success: true,
      message: "Agreement uploaded successfully",
      url: upload.url,
    });
  } catch (err) {
    console.error("❌ Agreement generation error:", err);
    res.status(500).json({ error: "Failed to generate/download agreement" });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (
      (user.role === "user" && booking.client_id !== user.id) ||
      (user.role === "provider" && booking.provider_id !== user.id)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (["Cancelled", "Completed"].includes(booking.status)) {
      return res.status(400).json({ error: `Booking already ${booking.status}` });
    }

    const [updatedBooking] = await sql`
      UPDATE bookings
      SET status = 'Cancelled', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking);

    const otherPartyId =
      user.role === "user" ? booking.provider_id : booking.client_id;

    const notificationData = {
      type: "booking",
      title: "Booking Cancelled",
      message: `Booking (ID: ${id}) has been cancelled by the ${user.role}.`,
      booking_id: id,
    };

    req.io.to(`user-${otherPartyId}`).emit("booking_cancelled", notificationData);

    // Persistent notify
    await saveNotification({
      userId: otherPartyId,
      type: "booking",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: id,
    });

    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    res.status(500).json({ error: "Failed to cancel booking." });
  }
};
