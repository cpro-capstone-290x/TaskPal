import express from 'express';
import { getAdmins, getAdmin, createAdmin, updateAdmin, deleteAdmin } from '../controllers/adminController.js';


const router = express.Router();
router.get("/", getAdmins);
router.get("/:id", getAdmin);
router.post("/", createAdmin);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);
export default router;