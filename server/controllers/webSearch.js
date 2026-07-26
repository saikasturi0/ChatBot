import { sendMessage } from "../services/chatService.js";

async function handleWebSearch(req, res){
    const {query} = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({
            success: false,
            message: "Query is required",
        });
    }

    try {

        const result = await sendMessage({
            userId: req.user._id,
            query: query.trim(),
            chatId: req.body.chatId
        });

        res.status(200).json({
            success: true,
            chat: result.chat,
            data: result.response,
            message: result.assistantMessage,
            sources: result.sources
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Error while searching",
        });
    }
}

export default handleWebSearch;
