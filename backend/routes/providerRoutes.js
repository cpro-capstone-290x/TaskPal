import express from "express";
import multer from "multer";
import { put } from "@vercel/blob";
import { protect, providerAuth, provider, adminAuth } from "../middleware/authMiddleware.js";
import {
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  getProvidersByServiceType,
  updateProviderStatus,
  uploadValidId,
  uploadProviderProfilePicture,
  uploadCompanyDocuments,
  uploadBackgroundCheck,
  uploadInsuranceDocument
} from "../controllers/providerController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ MUST BE AT THE VERY TOP — PUBLIC ROUTE
router.post("/valid-id", upload.single("file"), uploadValidId);
router.post(
  "/company-docs",
  upload.array("files", 10), // allow up to 10 documents
  uploadCompanyDocuments
);
router.post("/background-check", upload.single("file"), uploadBackgroundCheck);
router.post("/insurance", upload.single("file"), uploadInsuranceDocument);




// 🌐 Public Routes
router.get("/public/service_type/:service_type", getProvidersByServiceType);
router.get("/public/:id", getProvider);
router.get("/", getProviders);
router.get("/service_type/:service_type", getProvidersByServiceType);

// 🔐 Provider Routes (self-access only)
router
  .route("/:id")
  .get(protect, providerAuth, getProvider)
  .put(protect, providerAuth, updateProvider)
  .delete(protect, providerAuth, deleteProvider);

// 🧩 Admin: Update provider status (approve / reject / suspend)
router.route("/:id/status").patch(protect, adminAuth, updateProviderStatus);


export default router;
