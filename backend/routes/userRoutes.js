// backend/routes/userRoutes.js
import express from "express";
import { getUsers, createUser, getUser, updateUsers, deleteUsers, verifyUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUsers);
router.delete("/:id", deleteUsers);
router.post("/verify", verifyUser); // verify OTP

export default router;
