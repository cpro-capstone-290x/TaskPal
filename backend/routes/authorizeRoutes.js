import express from 'express';
import { getAuthorizedUsers, getauthorizeUser, createAuthorizedUser, updateAuthorizedUser, deleteAuthorizedUser} from '../controllers/authorizeController.js';


const router = express.Router();
router.get("/", getAuthorizedUsers);
router.get("/:id", getauthorizeUser);
router.post("/", createAuthorizedUser);
router.put("/:id", updateAuthorizedUser);
router.delete("/:id", deleteAuthorizedUser);


export default router;