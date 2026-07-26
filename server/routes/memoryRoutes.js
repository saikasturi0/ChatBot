import express from "express";
import { AuthenticateUser } from "../controllers/Authentication.js";
import {
    handleDeleteMemory,
    handleGetMemory,
    handleSaveMemory
} from "../controllers/memory.js";

const router = express.Router();

router.get("/memory", AuthenticateUser, handleGetMemory);
router.post("/memory", AuthenticateUser, handleSaveMemory);
router.patch("/memory", AuthenticateUser, handleSaveMemory);
router.delete("/memory", AuthenticateUser, handleDeleteMemory);

export default router;
