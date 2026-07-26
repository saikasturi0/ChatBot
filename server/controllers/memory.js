import {
    deleteMemory,
    getMemory,
    upsertMemory
} from "../services/memoryService.js";

async function handleGetMemory(req, res) {
    const memory = await getMemory(req.user._id);
    return res.status(200).json({
        success: true,
        memory: memory || {
            summary: "",
            facts: []
        }
    });
}

async function handleSaveMemory(req, res) {
    try {
        const memory = await upsertMemory({
            userId: req.user._id,
            summary: req.body.summary,
            facts: req.body.facts
        });

        return res.status(200).json({
            success: true,
            memory
        });
    } catch (error) {
        console.error("Save memory error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save memory"
        });
    }
}

async function handleDeleteMemory(req, res) {
    await deleteMemory(req.user._id);
    return res.status(200).json({
        success: true,
        message: "Memory deleted successfully"
    });
}

export {
    handleDeleteMemory,
    handleGetMemory,
    handleSaveMemory
};
