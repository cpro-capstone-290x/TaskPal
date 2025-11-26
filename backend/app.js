import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import { mockAuth } from "./middleware/mockAuth.js";
import { protect } from "./middleware/authMiddleware.js";


// 🧩 Controllers
import {
  getUsers,
  getUser,
  updateUsers,
  deleteUsers,
  uploadProfilePicture,
  getPublicUserById,
} from "./controllers/userController.js";

import {
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  updateProviderStatus,
  getProvidersByServiceType,
  uploadProviderProfilePicture,
} from "./controllers/providerController.js";

import {
  createReview,
  getReviewByBooking,
  getReviewsByProvider,
} from "./controllers/reviewController.js";

import {
  createPaymentIntent,
  verifyPaymentSession,
} from "./controllers/paymentController.js";

import {
  getExecutionByBooking,
  createExecutionIfMissing,
  updateExecutionField
} from "./controllers/executionController.js";

import {
  bookTask,
  getBookingById,
  updateBookingPrice,
  agreeToPrice,
  downloadAgreement,
  cancelBooking,
} from "./controllers/bookingController.js";

import {
  loginUser,
  loginProvider,
  loginAdmin,
  registerUser,
  registerProvider,
  registerAdmin,
  registerAuthorizedUser,
  verifyUserOTP,
  verifyProviderOTP,
  verifyAdminOTP,
  verifyAuthorizedOTP,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  updatePasswordAfterOTP,
  getAuthorizedUsers,
  deleteAuthorizedUser,
} from "./controllers/authController.js";

import {
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPendingProviders,
  getProviderForAdmin,
} from "./controllers/adminController.js";

// Import the Announcement Controller
import {
  createAnnouncement,
  getActiveAnnouncement,
  getAllAnnouncements,
  activateAnnouncement,
  completeAnnouncement,
  deleteAnnouncement
} from "./controllers/announcementController.js";

import {
  getNotifications,
  markAllAsRead,
  markOneAsRead
} from "./controllers/notificationController.js";

// 🚀 Initialize Express app
const app = express();

// 🧠 Global Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🗂️ Setup Multer (in-memory upload)
const upload = multer({ storage: multer.memoryStorage() });

/* -------------------------------------------------------------------------- */
/* 🧍 USER ROUTES                                                             */
/* -------------------------------------------------------------------------- */
app.get("/api/users", getUsers);
app.get("/api/users/:id", getUser);
app.put("/api/users/:id", updateUsers);
app.delete("/api/users/:id", deleteUsers);
app.post("/api/users/:id/profile-picture", upload.single("file"), uploadProfilePicture);
app.get("/api/public/users/:id", getPublicUserById);

/* -------------------------------------------------------------------------- */
/* 🧑‍🔧 PROVIDER ROUTES                                                       */
/* -------------------------------------------------------------------------- */
app.get("/api/providers", getProviders);
app.get("/api/providers/:id", getProvider);
app.put("/api/providers/:id", updateProvider);
app.delete("/api/providers/:id", deleteProvider);
app.put("/api/providers/:id/status", updateProviderStatus);
app.get("/api/providers/service_type/:service_type", getProvidersByServiceType);
app.post("/api/providers/:providerId/upload", upload.single("file"), uploadProviderProfilePicture);

/* -------------------------------------------------------------------------- */
/* 🗒️ REVIEW ROUTES                                                           */
/* -------------------------------------------------------------------------- */
app.post("/api/reviews", mockAuth, createReview);
app.get("/api/reviews/booking/:bookingId", getReviewByBooking);
app.get("/api/reviews/provider/:providerId", getReviewsByProvider);

/* -------------------------------------------------------------------------- */
/* 💳 PAYMENT ROUTES                                                          */
/* -------------------------------------------------------------------------- */
app.post("/api/payments/:bookingId", createPaymentIntent);
app.get("/api/payments/verify/:sessionId", verifyPaymentSession);

/* -------------------------------------------------------------------------- */
/* ⚙️ EXECUTION ROUTES                                                         */
/* -------------------------------------------------------------------------- */
app.post("/api/execution", createExecutionIfMissing);
app.put("/api/execution/:execution_id", updateExecutionField);
app.get("/api/execution/booking/:bookingId", getExecutionByBooking);

/* -------------------------------------------------------------------------- */
/* 📅 BOOKING ROUTES                                                          */
/* -------------------------------------------------------------------------- */
app.post("/api/bookings", bookTask);
app.get("/api/bookings/:id", getBookingById);
app.put("/api/bookings/:id/price", updateBookingPrice);
app.put("/api/bookings/:id/agree", agreeToPrice);
app.get("/api/bookings/:id/download", downloadAgreement);
app.put("/api/bookings/:id/cancel", cancelBooking);

/* -------------------------------------------------------------------------- */
/* 📢 SYSTEM ANNOUNCEMENT ROUTES                                              */
/* -------------------------------------------------------------------------- */
app.post("/api/announcements", createAnnouncement);
app.get("/api/announcements", getAllAnnouncements);
app.get("/api/announcements/active", getActiveAnnouncement);
app.put("/api/announcements/:id/activate", activateAnnouncement);
app.put("/api/announcements/:id/complete", completeAnnouncement);
app.delete("/api/announcements/:id", deleteAnnouncement);

/* -------------------------------------------------------------------------- */
/* 🔐 Authentication Routes                                                   */
/* -------------------------------------------------------------------------- */

// 🧭 Login routes
app.post("/api/auth/loginUser", loginUser);
app.post("/api/auth/loginProvider", loginProvider);
app.post("/api/auth/loginAdmin", loginAdmin);

// 🧭 Registration routes
app.post("/api/auth/registerUser", registerUser);
app.post("/api/auth/registerProvider", registerProvider);
app.post("/api/auth/registerAdmin", registerAdmin);
app.post("/api/auth/registerAuthorizedUser", registerAuthorizedUser);

// 🧭 OTP verification
app.post("/api/auth/verifyUser", verifyUserOTP);
app.post("/api/auth/verifyProvider", verifyProviderOTP);
app.post("/api/auth/verifyAdmin", verifyAdminOTP);
app.post("/api/auth/verifyAuthorize", verifyAuthorizedOTP);

// 🧭 Password reset flow
app.post("/api/auth/send-reset-otp", sendPasswordResetOTP);
app.post("/api/auth/verify-reset-otp", verifyPasswordResetOTP);
app.post("/api/auth/update-password", updatePasswordAfterOTP);

// 🧭 Authorized user management
app.get("/api/auth/authorized-users/:userId", getAuthorizedUsers);
app.delete("/api/auth/authorized-user/:authUserId", deleteAuthorizedUser);


app.get("/api/admins", getAdmins);
app.get("/api/admins/:id", getAdmin);
app.post("/api/admins", createAdmin);
app.put("/api/admins/:id", updateAdmin);
app.delete("/api/admins/:id", deleteAdmin);

// Additional admin-provider review routes
app.get("/api/admins/providers/pending", getPendingProviders);
app.get("/api/admins/providers/:id", getProviderForAdmin);

app.get("/api/notifications/:userId", getNotifications);
app.put("/api/notifications/:userId/read-all", markAllAsRead);
app.put("/api/notification/:id/read-one", protect, markOneAsRead);

/* -------------------------------------------------------------------------- */
/* 🧩 HEALTH CHECK (Optional)                                                 */
/* -------------------------------------------------------------------------- */
app.get("/health", (req, res) => {
  res.json({ status: "✅ Server is running", timestamp: new Date().toISOString() });
});

/* -------------------------------------------------------------------------- */
/* ✅ EXPORT FOR TESTING                                                      */
/* -------------------------------------------------------------------------- */

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

export default app;