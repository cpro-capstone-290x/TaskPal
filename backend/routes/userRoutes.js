// ✅ backend/routes/userRoutes.js
import express from "express";
import multer from "multer";
import {
  getUsers,
  getUser,
  updateUsers,
  deleteUsers,
  uploadProfilePicture,
  getPublicUserById,
  uploadUserDocument
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Correct order: public route FIRST
router.get("/public/:id", getPublicUserById);

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUsers);
router.delete("/:id", deleteUsers);

// ✅ Profile picture routes
router.post("/:id/profile-picture", upload.single("file"), uploadProfilePicture);
router.post("/:id/user-document", upload.single("file"), uploadUserDocument);



export default router;
