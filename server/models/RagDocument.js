import mongoose from "mongoose";

const ragDocumentSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    chunkCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["processing", "ready", "failed"],
        default: "processing"
    },
    error: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
});

ragDocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.RagDocument || mongoose.model("RagDocument", ragDocumentSchema);
