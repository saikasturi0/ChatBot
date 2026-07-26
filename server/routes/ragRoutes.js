import express from "express";
import multer from "multer";
import { AuthenticateUser } from "../controllers/Authentication.js";
import {
    handleDeleteDocument,
    handleListDocuments,
    handleUploadDocument
} from "../controllers/rag.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown"
        ];
        const allowedExtensions = [".pdf", ".docx", ".txt", ".md", ".markdown"];
        const fileName = file.originalname.toLowerCase();
        const hasAllowedExtension = allowedExtensions.some((extension) => fileName.endsWith(extension));

        if (!allowedTypes.includes(file.mimetype) && !hasAllowedExtension) {
            cb(new Error("Only PDF, DOCX, TXT, and Markdown files are supported"));
            return;
        }
        cb(null, true);
    }
});

router.post("/rag/documents", AuthenticateUser, upload.single("document"), handleUploadDocument);
router.get("/rag/documents", AuthenticateUser, handleListDocuments);
router.delete("/rag/documents/:documentId", AuthenticateUser, handleDeleteDocument);

router.use((error, req, res, next) => {
    if (!error) {
        next();
        return;
    }

    return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Document upload failed"
    });
});

export default router;
