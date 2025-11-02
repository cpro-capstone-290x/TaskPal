// backend/routes/userRoutes.js
import express from "express";
import multer from "multer";
import { getUsers, getUser, updateUsers, deleteUsers, uploadProfilePicture } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUsers);
router.delete("/:id", deleteUsers);
router.put("/:id", updateUsers);

// ✅ Profile picture routes
router.post("/:id/profile-picture", upload.single("file"), uploadProfilePicture);

export default router;
