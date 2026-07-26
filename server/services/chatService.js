import Chat from "../models/Chat.js";
import Message from "../models/Messages.js";
import RagDocument from "../models/RagDocument.js";
import chat from "../config/gemini.js";
import { retrieveContext } from "./ragService.js";
import { getMemoryContext, updateMemory } from "./memoryService.js";

const HISTORY_LIMIT = 12;
const EMPTY_RETRIEVAL = { context: "", sources: [] };

async function listChats(userId, options = {}) {
    const search = String(options.search || "").trim();
    const filter = { userId };

    if (search) {
        filter.title = { $regex: escapeRegex(search), $options: "i" };
    }

    return Chat.find(filter)
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(Math.min(Number(options.limit) || 80, 200))
        .select("title lastMessage messageCount totalMessages isPinned updatedAt createdAt")
        .lean();
}

async function getChatMessages({ userId, chatId }) {
    const chatDoc = await Chat.findOne({ _id: chatId, userId }).lean();
    if (!chatDoc) {
        return null;
    }

    const messages = await Message.find({ chatId })
        .sort({ createdAt: 1 })
        .lean();

    return {
        chat: chatDoc,
        messages
    };
}

async function sendMessage({ userId, query, chatId, images = [] }) {
    const finalQuery = String(query || "").trim();
    if (!finalQuery && images.length === 0) {
        throw new Error("Message or image is required");
    }

    const chatDoc = await resolveChat({ userId, chatId, query: finalQuery, images });
    const previousMessages = await Message.find({ chatId: chatDoc._id })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .lean();

    const history = [...previousMessages]
        .reverse()
        .map((message) => ({
            role: message.role,
            content: message.content
        }));

    const resourceDecision = finalQuery
        ? await shouldUseDocumentContext({ userId, query: finalQuery, previousMessages })
        : { useDocumentContext: false, reason: "no text query" };
    const retrieval = resourceDecision.useDocumentContext
        ? await retrieveContext({ userId, query: finalQuery })
        : EMPTY_RETRIEVAL;
    const memoryContext = await getMemoryContext(userId);
    const promptImages = getPromptImages({ images, previousMessages, query: finalQuery });

    if (process.env.NODE_ENV !== "production") {
        console.log(`Resource context: documents=${resourceDecision.useDocumentContext ? "enabled" : "skipped"} (${resourceDecision.reason}); images=${promptImages.length > images.length ? "reloaded" : images.length > 0 ? "current upload" : "skipped"}`);
    }

    const userMessage = await Message.create({
        userId,
        chatId: chatDoc._id,
        role: "user",
        content: finalQuery || "Analyze the uploaded image.",
        attachments: images.map((image) => ({
            type: "image",
            fileName: image.originalname,
            fileUrl: `data:${image.mimetype};base64,${image.buffer.toString("base64")}`,
            mimeType: image.mimetype,
            size: image.size,
            data: image.buffer.toString("base64")
        })),
        imageReferences: images.map((image) => ({
            fileName: image.originalname,
            mimeType: image.mimetype,
            size: image.size
        }))
    });

    const result = await chat(finalQuery || "Analyze the uploaded image.", {
        ragContext: retrieval.context,
        memoryContext,
        history,
        images: promptImages
    });

    if (!result.success) {
        throw new Error(result.response || "AI response failed");
    }

    const assistantMessage = await Message.create({
        userId,
        chatId: chatDoc._id,
        role: "assistant",
        content: result.response,
        ragReferences: retrieval.sources,
        citations: retrieval.sources.map((source) => `${source.label}: ${source.fileName}`)
    });

    chatDoc.lastMessage = result.response.slice(0, 240);
    chatDoc.messageCount += 2;
    chatDoc.totalMessages = chatDoc.messageCount;
    if (chatDoc.title === "New Chat") {
        chatDoc.title = createTitle(finalQuery, images);
    }
    await chatDoc.save();

    await updateMemory({
        userId,
        userMessage: finalQuery || "[User uploaded an image for analysis]",
        assistantMessage: result.response
    });

    return {
        
        chat: chatDoc,
        userMessage,
        assistantMessage,
        response: result.response,
        sources: retrieval.sources
    };
}

async function resolveChat({ userId, chatId, query, images = [] }) {
    if (chatId) {
        const existing = await Chat.findOne({ _id: chatId, userId });
        if (existing) {
            return existing;
        }
    }

    return Chat.create({
        userId,
        title: createTitle(query, images),
        lastMessage: "",
        messageCount: 0,
        totalMessages: 0
    });
}

async function renameChat({ userId, chatId, title }) {
    return Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { title: String(title || "").trim().slice(0, 80) || "Untitled Chat" },
        { new: true }
    );
}

async function pinChat({ userId, chatId, isPinned }) {
    return Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { isPinned: Boolean(isPinned) },
        { new: true }
    );
}

async function deleteChat({ userId, chatId }) {
    const chatDoc = await Chat.findOne({ _id: chatId, userId });
    if (!chatDoc) {
        return null;
    }

    await Message.deleteMany({ chatId: chatDoc._id, userId });
    await chatDoc.deleteOne();
    return chatDoc;
}

async function duplicateChat({ userId, chatId }) {
    const chatDoc = await Chat.findOne({ _id: chatId, userId }).lean();
    if (!chatDoc) {
        return null;
    }

    const messages = await Message.find({ chatId, userId }).sort({ createdAt: 1 }).lean();
    const copy = await Chat.create({
        userId,
        title: `${chatDoc.title} Copy`.slice(0, 80),
        lastMessage: chatDoc.lastMessage,
        messageCount: chatDoc.messageCount,
        totalMessages: chatDoc.totalMessages || chatDoc.messageCount,
        isPinned: false
    });

    if (messages.length > 0) {
        await Message.insertMany(messages.map((message) => ({
            userId,
            chatId: copy._id,
            role: message.role,
            content: message.content,
            attachments: message.attachments,
            citations: message.citations,
            ragReferences: message.ragReferences,
            webReferences: message.webReferences,
            imageReferences: message.imageReferences
        })));
    }

    return copy;
}

async function createEmptyChat({ userId, title = "New Chat" }) {
    return Chat.create({
        userId,
        title: String(title || "New Chat").trim().slice(0, 80) || "New Chat",
        lastMessage: "",
        messageCount: 0,
        totalMessages: 0
    });
}

function createTitle(query, images = []) {
    if (query) {
        return query
            .replace(/[^\w\s-]/g, "")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 7)
            .join(" ")
            .slice(0, 60) || "New Chat";
    }

    if (images.length > 0) {
        return `Image: ${images[0].originalname}`.slice(0, 60);
    }

    return "New Chat";
}

async function shouldUseDocumentContext({ userId, query, previousMessages }) {
    if (!query) {
        return {
            useDocumentContext: false,
            reason: "empty query"
        };
    }

    const documents = await RagDocument.find({ userId, status: "ready" })
        .select("fileName")
        .lean();

    if (documents.length === 0) {
        return {
            useDocumentContext: false,
            reason: "no indexed documents"
        };
    }

    if (matchesDocumentReference(query, documents)) {
        return {
            useDocumentContext: true,
            reason: "current prompt references uploaded document"
        };
    }

    if (wasDocumentRecentlyUsed(previousMessages) && matchesDocumentFollowUp(query)) {
        return {
            useDocumentContext: true,
            reason: "resource follow-up after recent document answer"
        };
    }

    return {
        useDocumentContext: false,
        reason: "no resource reference in current prompt"
    };
}

function matchesDocumentReference(query, documents) {
    const normalized = normalizeForMatch(query);
    const explicitDocumentPattern = /\b(uploaded|attached|this|that|it|its|document|documents|doc|docx|pdf|file|files|source\s*\d+|page\s*\d+|chapter\s*\d+|resume|cv|invoice|receipt|report|paper|article|contract|spreadsheet|markdown|txt)\b/i;
    const bareResourceInstructionPattern = /^\s*(summari[sz]e|summary|read|analy[sz]e|extract|explain)\s*[?.!]*\s*$/i;

    if (explicitDocumentPattern.test(query) || bareResourceInstructionPattern.test(query)) {
        return true;
    }

    return documents.some((document) => {
        const words = normalizeForMatch(document.fileName.replace(/\.[^.]+$/, ""))
            .split(" ")
            .filter((word) => word.length > 2);

        return words.length > 0 && words.some((word) => normalized.includes(word));
    });
}

function matchesDocumentFollowUp(query) {
    const followUpPattern = /\b(this|that|it|its|they|them|mentioned|listed|according to|from the|in the|technical skills?|skills?|projects?|experience|education|certifications?|achievements?|summary|summarize|key points?|details?|source\s*\d+|page\s*\d+|chapter\s*\d+|resume|invoice|report)\b/i;
    return followUpPattern.test(query);
}

function wasDocumentRecentlyUsed(previousMessages) {
    return previousMessages.some((message) => (
        Array.isArray(message.ragReferences) && message.ragReferences.length > 0
    ));
}

function getPromptImages({ images, previousMessages, query }) {
    if (images.length > 0) {
        if (!query || matchesImageReference(query)) {
            return images.map((image) => ({
                mimeType: image.mimetype,
                data: image.buffer.toString("base64")
            }));
        }

        return [];
    }

    if (!shouldReloadImageContext({ query, previousMessages })) {
        return [];
    }

    const imageMessage = previousMessages.find((message) => (
        Array.isArray(message.attachments)
        && message.attachments.some((attachment) => attachment.type === "image" && attachment.data && attachment.mimeType)
    ));

    if (!imageMessage) {
        return [];
    }

    return imageMessage.attachments
        .filter((attachment) => attachment.type === "image" && attachment.data && attachment.mimeType)
        .slice(0, 5)
        .map((attachment) => ({
            mimeType: attachment.mimeType,
            data: attachment.data
        }));
}

function shouldReloadImageContext({ query, previousMessages }) {
    if (!query || !wasImageRecentlyUploaded(previousMessages)) {
        return false;
    }

    return matchesImageReference(query);
}

function matchesImageReference(query) {
    const imageReferencePattern = /\b(uploaded|attached|this|that|it|its|them|image|images|picture|photo|screenshot|chart|graph|diagram|visual|text from|read the text|describe|analy[sz]e)\b/i;
    const bareImageInstructionPattern = /^\s*(describe|analy[sz]e|read|extract text|what'?s in (this|it)|explain)\s*[?.!]*\s*$/i;
    return imageReferencePattern.test(query) || bareImageInstructionPattern.test(query);
}

function wasImageRecentlyUploaded(previousMessages) {
    return previousMessages.some((message) => (
        Array.isArray(message.attachments)
        && message.attachments.some((attachment) => attachment.type === "image" && attachment.data)
    ));
}

function normalizeForMatch(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export {
    listChats,
    getChatMessages,
    sendMessage,
    createEmptyChat,
    renameChat,
    pinChat,
    deleteChat,
    duplicateChat
};
