import express from "express";
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
  deleteAuthorizedUser
} from "../controllers/authController.js";
const router = express.Router();

router.post("/loginUser", loginUser);
router.post("/loginProvider", loginProvider);
router.post("/loginAdmin", loginAdmin);
router.post("/registerUser", registerUser);
router.post("/verifyUser", verifyUserOTP);    // for OTP verification
router.post("/registerProvider", registerProvider);
router.post("/verifyProvider", verifyProviderOTP); // for OTP verification
router.post("/registerAdmin", registerAdmin);
router.post("/verifyAdmin", verifyAdminOTP); // for OTP verification
router.post("/registerAuthorizedUser", registerAuthorizedUser);
router.post("/verifyAuthorize", verifyAuthorizedOTP); // for OTP verification
router.post("/send-reset-otp", sendPasswordResetOTP);        // send OTP to email
router.post("/verify-reset-otp", verifyPasswordResetOTP);    // verify OTP
router.post("/update-password", updatePasswordAfterOTP);     // update password after OTP verification
router.get("/authorized-users/:userId", getAuthorizedUsers); // get authorized users for a user
router.delete("/authorized-user/:authUserId", deleteAuthorizedUser); // delete an authorized user


export default router;