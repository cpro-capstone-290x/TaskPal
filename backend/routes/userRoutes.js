// backend/routes/userRoutes.js
import express from "express";
import { getUsers, createUser, getUser, updateUsers, deleteUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.get("/:id", updateUsers);
router.get("/:id", deleteUsers);

export default router;
