import mongoose from "mongoose";

const ragChunkSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RagDocument",
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    }
},
{
    timestamps: true
});

ragChunkSchema.index({ userId: 1, documentId: 1, chunkIndex: 1 });

export default mongoose.models.RagChunk || mongoose.model("RagChunk", ragChunkSchema);
