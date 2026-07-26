import {
    deleteDocument,
    ingestDocument,
    listDocuments
} from "../services/ragService.js";

async function handleUploadDocument(req, res) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please upload a PDF, DOCX, TXT, or Markdown file"
        });
    }

    try {
        const document = await ingestDocument({
            userId: req.user._id,
            file: req.file
        });

        return res.status(201).json({
            success: true,
            message: "Document indexed successfully",
            document: {
                id: document._id,
                fileName: document.fileName,
                chunkCount: document.chunkCount,
                status: document.status
            }
        });
    } catch (error) {
        console.error("RAG upload error:", error.message);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to index document"
        });
    }
}

async function handleListDocuments(req, res) {
    try {
        const documents = await listDocuments(req.user._id);
        return res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        console.error("RAG list error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents"
        });
    }
}

async function handleDeleteDocument(req, res) {
    try {
        const document = await deleteDocument({
            userId: req.user._id,
            documentId: req.params.documentId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("RAG delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete document"
        });
    }
}

export {
    handleUploadDocument,
    handleListDocuments,
    handleDeleteDocument
};
