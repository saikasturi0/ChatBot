import {
    createEmptyChat,
    deleteChat,
    duplicateChat,
    getChatMessages,
    listChats,
    pinChat,
    renameChat,
    sendMessage
} from "../services/chatService.js";

async function handleListChats(req, res) {
    try {
        const chats = await listChats(req.user._id, {
            search: req.query.search,
            limit: req.query.limit
        });
        return res.status(200).json({
            success: true,
            chats
        });
    } catch (error) {
        console.error("List chats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load chats"
        });
    }
}

async function handleGetChatMessages(req, res) {
    try {
        const result = await getChatMessages({
            userId: req.user._id,
            chatId: req.params.chatId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        return res.status(200).json({
            success: true,
            chat: result.chat,
            messages: result.messages
        });
    } catch (error) {
        console.error("Get chat messages error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load chat messages"
        });
    }
}

async function handleSendTextMessage(req, res) {
    try {
        const result = await sendMessage({
            userId: req.user._id,
            query: req.body.query,
            chatId: req.body.chatId
        });

        return res.status(200).json({
            success: true,
            chat: result.chat,
            data: result.response,
            message: result.assistantMessage,
            sources: result.sources
        });
    } catch (error) {
        console.error("Send text message error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send message"
        });
    }
}

async function handleSendImageMessage(req, res) {
    try {
        const result = await sendMessage({
            userId: req.user._id,
            query: req.body.query,
            chatId: req.body.chatId,
            images: req.files || []
        });

        return res.status(200).json({
            success: true,
            chat: result.chat,
            data: result.response,
            message: result.assistantMessage,
            sources: result.sources
        });
    } catch (error) {
        console.error("Send image message error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze image"
        });
    }
}

async function handleCreateChat(req, res) {
    try {
        const chat = await createEmptyChat({
            userId: req.user._id,
            title: req.body.title || "New Chat"
        });

        return res.status(201).json({
            success: true,
            chat
        });
    } catch (error) {
        console.error("Create chat error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create chat"
        });
    }
}

async function handleUpdateChat(req, res) {
    try {
        let chat = null;
        if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
            chat = await renameChat({
                userId: req.user._id,
                chatId: req.params.chatId,
                title: req.body.title
            });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "isPinned")) {
            chat = await pinChat({
                userId: req.user._id,
                chatId: req.params.chatId,
                isPinned: req.body.isPinned
            });
        }

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        return res.status(200).json({
            success: true,
            chat
        });
    } catch (error) {
        console.error("Update chat error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update chat"
        });
    }
}

async function handleDeleteChat(req, res) {
    try {
        const chat = await deleteChat({
            userId: req.user._id,
            chatId: req.params.chatId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chat deleted successfully"
        });
    } catch (error) {
        console.error("Delete chat error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete chat"
        });
    }
}

async function handleDuplicateChat(req, res) {
    try {
        const chat = await duplicateChat({
            userId: req.user._id,
            chatId: req.params.chatId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        return res.status(201).json({
            success: true,
            chat
        });
    } catch (error) {
        console.error("Duplicate chat error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to duplicate chat"
        });
    }
}

export {
    handleCreateChat,
    handleDeleteChat,
    handleDuplicateChat,
    handleGetChatMessages,
    handleListChats,
    handleSendImageMessage,
    handleSendTextMessage,
    handleUpdateChat
};
