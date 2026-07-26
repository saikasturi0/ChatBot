import mongoose from "mongoose";

const userMemorySchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true
    },
    summary: {
        type: String,
        default: ""
    },
    facts: {
        type: [String],
        default: []
    }
},
{
    timestamps: true
});

export default mongoose.models.UserMemory || mongoose.model("UserMemory", userMemorySchema);
