import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    title: {
        type: String,
        default: "New Chat"
    },

    lastMessage: {
        type: String,
        default: ""
    },

    messageCount: {
        type: Number,
        default: 0
    },

    totalMessages: {
        type: Number,
        default: 0
    },

    isPinned: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});

chatSchema.index({
    userId: 1,
    updatedAt: -1
});

export default mongoose.model("Chat", chatSchema);
