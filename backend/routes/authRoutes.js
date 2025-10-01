import express from "express";
import { registerUser, registerProvider, registerAdmin, registerAuthorizedUser, verifyUserOTP, verifyProviderOTP, verifyAdminOTP, verifyAuthorizedOTP} from "../controllers/authController.js";

const router = express.Router();

router.post("/registerUser", registerUser);
router.post("/verifyUser", verifyUserOTP);    // for OTP verification
router.post("/registerProvider", registerProvider);
router.post("/verifyProvider", verifyProviderOTP); // for OTP verification
router.post("/registerAdmin", registerAdmin);
router.post("/verifyAdmin", verifyAdminOTP); // for OTP verification
router.post("/registerAuthorizedUser", registerAuthorizedUser);
router.post("/verifyAuthorize", verifyAuthorizedOTP); // for OTP verification

export default router;