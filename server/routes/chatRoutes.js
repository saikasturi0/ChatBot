import express from "express";
import multer from "multer";
import { AuthenticateUser } from "../controllers/Authentication.js";
import {
    handleCreateChat,
    handleDeleteChat,
    handleDuplicateChat,
    handleGetChatMessages,
    handleListChats,
    handleSendImageMessage,
    handleSendTextMessage,
    handleUpdateChat
} from "../controllers/chat.js";

const router = express.Router();
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files are supported"));
            return;
        }
        cb(null, true);
    }
});

router.get("/chats", AuthenticateUser, handleListChats);
router.get("/chat", AuthenticateUser, handleListChats);
router.post("/chat", AuthenticateUser, handleCreateChat);
router.get("/chats/:chatId/messages", AuthenticateUser, handleGetChatMessages);
router.get("/chat/:chatId", AuthenticateUser, handleGetChatMessages);
router.patch("/chat/:chatId", AuthenticateUser, handleUpdateChat);
router.patch("/chats/:chatId", AuthenticateUser, handleUpdateChat);
router.delete("/chat/:chatId", AuthenticateUser, handleDeleteChat);
router.delete("/chats/:chatId", AuthenticateUser, handleDeleteChat);
router.post("/chat/:chatId/duplicate", AuthenticateUser, handleDuplicateChat);
router.post("/chats/:chatId/duplicate", AuthenticateUser, handleDuplicateChat);
router.post("/chats/message", AuthenticateUser, handleSendTextMessage);
router.post("/chat/message", AuthenticateUser, handleSendTextMessage);
router.post("/chats/message/image", AuthenticateUser, imageUpload.array("images", 5), handleSendImageMessage);
router.post("/chat/image", AuthenticateUser, imageUpload.array("images", 5), handleSendImageMessage);

router.use((error, req, res, next) => {
    if (!error) {
        next();
        return;
    }

    return res.status(400).json({
        success: false,
        message: error.message || "Upload failed"
    });
});

export default router;
