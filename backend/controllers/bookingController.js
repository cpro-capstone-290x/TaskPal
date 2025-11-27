// controllers/bookingController.js
import crypto from "crypto";
import { sql } from "../config/db.js";
import PDFDocument from "pdfkit";
import { put } from "@vercel/blob";
import fs from "fs";
import { logAudit } from "../utils/auditLogger.js";
import logger from "../utils/logger.js";

/* -------------------------------------------------------------------------- */
/* Helpers: traceId + notifications                                           */
/* -------------------------------------------------------------------------- */

const getTraceId = (req) =>
  req.traceId ||
  req.headers["x-request-id"] ||
  crypto.randomUUID();

// 🔥 Helper to save notifications to DB
async function saveNotification({ userId, type, title, message, bookingId, traceId }) {
  try {
    await sql`
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${bookingId})
    `;
    logger.info("Notification saved", {
      traceId,
      userId,
      bookingId,
      type,
      title,
    });
  } catch (err) {
    logger.error("Failed to save notification", {
      traceId,
      userId,
      bookingId,
      type,
      error: err.message,
      stack: err.stack,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* BOOKING CREATION                                                           */
/* -------------------------------------------------------------------------- */

export const bookTask = async (req, res) => {
  const traceId = getTraceId(req);
  const { client_id, provider_id, notes, scheduled_date, price } = req.body;

  if (!client_id || !provider_id || !scheduled_date) {
    return res.status(400).json({
      error: "client_id, provider_id, and scheduled_date are required",
    });
  }

  try {
    logger.info("Booking creation initiated", {
      traceId,
      client_id,
      provider_id,
      scheduled_date,
      price,
    });

    /* ------------------------------------------------------------- */
    /* 1️⃣ CHECK IF USER ALREADY HAS A PENDING BOOKING                */
    /* ------------------------------------------------------------- */
    const existingPending = await sql`
      SELECT id, status
      FROM bookings
      WHERE client_id = ${client_id}
      AND provider_id = ${provider_id} 
      AND status = 'Pending'
      LIMIT 1;
    `;

    if (existingPending.length > 0) {
      logger.warn("Booking blocked: existing pending booking", {
        traceId,
        client_id,
        existingBookingId: existingPending[0].id,
      });

      return res.status(409).json({
        error:
          "You already have a pending booking. Please wait until it is completed or cancelled.",
        existingBookingId: existingPending[0].id,
      });
    }
    /* ------------------------------------------------------------- */
    /* END CHECK                                                     */
    /* ------------------------------------------------------------- */

    // 2️⃣ Create booking
    const [booking] = await sql`
      INSERT INTO bookings (client_id, provider_id, notes, scheduled_date, price)
      VALUES (${client_id}, ${provider_id}, ${notes}, ${scheduled_date}, ${price})
      RETURNING *, notes;
    `;

    logger.info("Booking created in DB", {
      traceId,
      bookingId: booking.id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      status: booking.status,
      price: booking.price,
    });

    // 3️⃣ Initialize empty chat record
    await sql`
      INSERT INTO chat_messages (booking_id, messages)
      VALUES (${booking.id}, '[]'::jsonb)
    `;

    logger.info("Chat record initialized for booking", {
      traceId,
      bookingId: booking.id,
    });

    // 4️⃣ Socket notification
    const notificationData = {
      type: "booking",
      title: "New Booking Request",
      message: `You have a new request. Notes: ${
        booking.notes ? booking.notes.substring(0, 30) : "N/A"
      }...`,
      booking_id: booking.id,
    };

    req.io.to(`user-${booking.provider_id}`).emit("new_booking", notificationData);

    logger.info("Sent 'new_booking' socket notification to provider", {
      traceId,
      provider_id: booking.provider_id,
      bookingId: booking.id,
    });

    // 5️⃣ Persistent DB notification
    await saveNotification({
      userId: booking.provider_id,
      type: "booking",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: booking.id,
      traceId,
    });

    // 6️⃣ Audit logs for booking creation
    await logAudit(client_id, "BOOKING_CREATED", {
      bookingId: booking.id,
      provider_id,
      price: booking.price,
      scheduled_date,
    });

    await logAudit(provider_id, "BOOKING_ASSIGNED", {
      bookingId: booking.id,
      client_id,
      price: booking.price,
      scheduled_date,
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
    logger.error("Booking creation error", {
      traceId,
      client_id,
      provider_id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to create booking" });
  }
};


/* -------------------------------------------------------------------------- */
/* GET BOOKING BY ID                                                          */
/* -------------------------------------------------------------------------- */

export const getBookingById = async (req, res) => {
  const traceId = getTraceId(req);
  const { id } = req.params;

  try {
    logger.info("Fetching booking by ID", {
      traceId,
      bookingId: id,
      requesterId: req.user?.id,
      requesterRole: req.user?.role,
    });

    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) {
      logger.warn("Booking not found", {
        traceId,
        bookingId: id,
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    const user = req.user;

    if (user.role === "user" && booking.client_id !== user.id) {
      logger.warn("Unauthorized booking access attempt (user)", {
        traceId,
        bookingId: id,
        userId: user.id,
        role: user.role,
      });
      return res
        .status(403)
        .json({ error: "Unauthorized to view this booking" });
    }

    if (user.role === "provider" && booking.provider_id !== user.id) {
      logger.warn("Unauthorized booking access attempt (provider)", {
        traceId,
        bookingId: id,
        userId: user.id,
        role: user.role,
      });
      return res
        .status(403)
        .json({ error: "Unauthorized to view this booking" });
    }

    logger.info("Booking fetched successfully", {
      traceId,
      bookingId: id,
      userId: user.id,
      role: user.role,
    });

    return res.json(booking);
  } catch (err) {
    logger.error("Error fetching booking", {
      traceId,
      bookingId: id,
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE BOOKING PRICE                                                       */
/* -------------------------------------------------------------------------- */

export const updateBookingPrice = async (req, res) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const { price } = req.body;
  const user = req.user;

  try {
    logger.info("Booking price update initiated", {
      traceId,
      bookingId: id,
      requestedById: user?.id,
      requestedByRole: user?.role,
      newPrice: price,
    });

    const [booking] = await sql`
      UPDATE bookings
      SET price = ${price}, status = 'Negotiating', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!booking) {
      logger.warn("Booking not found for price update", {
        traceId,
        bookingId: id,
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    req.io.to(`chat-${id}`).emit("booking_updated", booking);

    const notificationData = {
      type: "payment",
      title: "Price Updated",
      message: `The provider proposed a new price: $${booking.price}`,
      booking_id: id,
    };

    // Socket notify user
    req.io
      .to(`user-${booking.client_id}`)
      .emit("payment_agreed", notificationData);

    logger.info("Sent 'payment_agreed' notification (price updated)", {
      traceId,
      bookingId: id,
      client_id: booking.client_id,
    });

    // Persistent notify
    await saveNotification({
      userId: booking.client_id,
      type: "payment",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: id,
      traceId,
    });

    // Audit log
    await logAudit(user?.id || booking.provider_id, "BOOKING_PRICE_UPDATED", {
      bookingId: id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      newPrice: booking.price,
    });

    res.json({ message: "Price updated successfully", booking });
  } catch (err) {
    logger.error("Error updating price", {
      traceId,
      bookingId: id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to update price" });
  }
};

/* -------------------------------------------------------------------------- */
/* AGREE TO PRICE                                                             */
/* -------------------------------------------------------------------------- */

export const agreeToPrice = async (req, res) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const { role } = req.body;
  const requester = req.user;

  try {
    logger.info("Price agreement update initiated", {
      traceId,
      bookingId: id,
      role,
      requesterId: requester?.id,
      requesterRole: requester?.role,
    });

    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) {
      logger.warn("Booking not found for agreeToPrice", {
        traceId,
        bookingId: id,
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    let updated;
    let notificationData = {};
    let notifyTo = null;
    let notifyUserId = null;
    let actorId = requester?.id || null;

    if (role === "user") {
      updated = await sql`
        UPDATE bookings
        SET agreement_signed_by_client = TRUE, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      notifyTo = `user-${updated[0].provider_id}`;
      notifyUserId = updated[0].provider_id;
      actorId = updated[0].client_id;
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
      actorId = updated[0].provider_id;
      notificationData = {
        type: "payment",
        title: "Provider Agreed",
        message: "The provider has agreed to the price.",
        booking_id: updated[0].id,
      };
    } else {
      logger.warn("Invalid role in agreeToPrice", {
        traceId,
        bookingId: id,
        role,
      });
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedBooking = updated[0];

    logger.info("Agreement flag updated", {
      traceId,
      bookingId: updatedBooking.id,
      agreement_signed_by_client: updatedBooking.agreement_signed_by_client,
      agreement_signed_by_provider: updatedBooking.agreement_signed_by_provider,
    });

    // 🔥 Persistent notify
    await saveNotification({
      userId: notifyUserId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      bookingId: updatedBooking.id,
      traceId,
    });

    // 🔥 Socket notify
    req.io.to(notifyTo).emit("payment_agreed", notificationData);

    // Audit for agreement step
    await logAudit(actorId, "BOOKING_PRICE_AGREED", {
      bookingId: updatedBooking.id,
      actorRole: role,
    });

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

      logger.info("Booking confirmed after both parties agreed", {
        traceId,
        bookingId: confirmedBooking.id,
        client_id: confirmedBooking.client_id,
        provider_id: confirmedBooking.provider_id,
      });

      req.io.to(`chat-${id}`).emit("booking_updated", confirmedBooking);

      const clientNotification = {
        type: "booking",
        title: "Booking Confirmed!",
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id,
      };
      req.io
        .to(`user-${confirmedBooking.client_id}`)
        .emit("new_booking", clientNotification);

      const providerNotification = {
        type: "booking",
        title: "Booking Confirmed!",
        message: `Your booking (ID: ${confirmedBooking.id}) is confirmed.`,
        booking_id: confirmedBooking.id,
      };
      req.io
        .to(`user-${confirmedBooking.provider_id}`)
        .emit("new_booking", providerNotification);

      // 🔥 Persistent for both client + provider
      await saveNotification({
        userId: confirmedBooking.client_id,
        type: "booking",
        title: clientNotification.title,
        message: clientNotification.message,
        bookingId: confirmedBooking.id,
        traceId,
      });
      await saveNotification({
        userId: confirmedBooking.provider_id,
        type: "booking",
        title: providerNotification.title,
        message: providerNotification.message,
        bookingId: confirmedBooking.id,
        traceId,
      });

      // Audit booking confirmed
      await logAudit(confirmedBooking.client_id, "BOOKING_CONFIRMED", {
        bookingId: confirmedBooking.id,
        as: "client",
      });
      await logAudit(confirmedBooking.provider_id, "BOOKING_CONFIRMED", {
        bookingId: confirmedBooking.id,
        as: "provider",
      });

      return res.json({
        message: "Booking confirmed",
        booking: confirmedBooking,
      });
    }

    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking);

    res.json({ message: "Agreement updated", booking: updatedBooking });
  } catch (err) {
    logger.error("Error updating agreement", {
      traceId,
      bookingId: id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to update agreement" });
  }
};

/* -------------------------------------------------------------------------- */
/* DOWNLOAD / GENERATE AGREEMENT PDF                                          */
/* -------------------------------------------------------------------------- */

export const downloadAgreement = async (req, res) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const user = req.user;

  try {
    logger.info("Agreement PDF generation requested", {
      traceId,
      bookingId: id,
      requestedById: user?.id,
      requestedByRole: user?.role,
    });

    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) {
      logger.warn("Booking not found for agreement download", {
        traceId,
        bookingId: id,
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    if (
      !booking.agreement_signed_by_client ||
      !booking.agreement_signed_by_provider
    ) {
      logger.warn("Agreement not fully signed, cannot generate PDF", {
        traceId,
        bookingId: id,
        agreement_signed_by_client: booking.agreement_signed_by_client,
        agreement_signed_by_provider: booking.agreement_signed_by_provider,
      });
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

    logger.info("Agreement PDF generated and uploaded", {
      traceId,
      bookingId: id,
      url: upload.url,
    });

    // Audit
    await logAudit(user?.id || null, "BOOKING_AGREEMENT_PDF_GENERATED", {
      bookingId: id,
      url: upload.url,
    });

    res.status(200).json({
      success: true,
      message: "Agreement uploaded successfully",
      url: upload.url,
    });
  } catch (err) {
    logger.error("Agreement generation error", {
      traceId,
      bookingId: id,
      error: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ error: "Failed to generate/download agreement" });
  }
};

/* -------------------------------------------------------------------------- */
/* CANCEL BOOKING                                                             */
/* -------------------------------------------------------------------------- */

export const cancelBooking = async (req, res) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const user = req.user;

  try {
    logger.info("Booking cancellation requested", {
      traceId,
      bookingId: id,
      requesterId: user?.id,
      requesterRole: user?.role,
    });

    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) {
      logger.warn("Booking not found for cancellation", {
        traceId,
        bookingId: id,
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    if (
      (user.role === "user" && booking.client_id !== user.id) ||
      (user.role === "provider" && booking.provider_id !== user.id)
    ) {
      logger.warn("Unauthorized booking cancellation attempt", {
        traceId,
        bookingId: id,
        userId: user.id,
        role: user.role,
      });
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (["Cancelled", "Completed"].includes(booking.status)) {
      logger.warn("Booking cancellation blocked: already final state", {
        traceId,
        bookingId: id,
        currentStatus: booking.status,
      });
      return res
        .status(400)
        .json({ error: `Booking already ${booking.status}` });
    }

    const [updatedBooking] = await sql`
      UPDATE bookings
      SET status = 'Cancelled', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    logger.info("Booking cancelled", {
      traceId,
      bookingId: updatedBooking.id,
      cancelledById: user.id,
      cancelledByRole: user.role,
    });

    req.io.to(`chat-${id}`).emit("booking_updated", updatedBooking);

    const otherPartyId =
      user.role === "user" ? booking.provider_id : booking.client_id;

    const notificationData = {
      type: "booking",
      title: "Booking Cancelled",
      message: `Booking (ID: ${id}) has been cancelled by the ${user.role}.`,
      booking_id: id,
    };

    req.io
      .to(`user-${otherPartyId}`)
      .emit("booking_cancelled", notificationData);

    // Persistent notify
    await saveNotification({
      userId: otherPartyId,
      type: "booking",
      title: notificationData.title,
      message: notificationData.message,
      bookingId: id,
      traceId,
    });

    // Audit logs
    await logAudit(user.id, "BOOKING_CANCELLED", {
      bookingId: updatedBooking.id,
      as: user.role,
    });
    await logAudit(otherPartyId, "BOOKING_CANCELLED_NOTIFIED", {
      bookingId: updatedBooking.id,
      notifiedAs: user.role === "user" ? "provider" : "client",
    });

    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (err) {
    logger.error("Error cancelling booking", {
      traceId,
      bookingId: id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to cancel booking." });
  }
};
