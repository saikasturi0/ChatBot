import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
{
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true
    },

    content: {
        type: String,
        required: true
    },

    attachments: [
        {
            type: {
                type: String,
                enum: ["image", "pdf"]
            },

            fileName: String,

            fileUrl: String,

            mimeType: String,

            size: Number,

            data: String,

            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    citations: {
        type: [String],
        default: []
    },

    ragReferences: {
        type: [Object],
        default: []
    },

    webReferences: {
        type: [Object],
        default: []
    },

    imageReferences: {
        type: [Object],
        default: []
    }
},
{
    timestamps: true
});

messageSchema.index({
    chatId: 1,
    createdAt: 1
});

messageSchema.index({
    userId: 1,
    createdAt: -1
});

export default mongoose.model("Message", messageSchema);
