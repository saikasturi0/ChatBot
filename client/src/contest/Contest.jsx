import { useEffect, useState } from "react";
import { Context } from "./Context";
import { API_BASE_URL } from "../config/api";

const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompt, setPrevPrompt] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async (search = "") => {
        try {
            const url = search
                ? `${API_BASE_URL}/chats?search=${encodeURIComponent(search)}`
                : `${API_BASE_URL}/chats`;
            const response = await fetch(url, {
                credentials: "include"
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setChats(data.chats);
            }
        } catch (error) {
            console.error("loadChats error:", error);
        }
    };

    const updateChat = async (chatId, updates) => {
        const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(updates)
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update chat");
        }
        await loadChats();
        return data.chat;
    };

    const deleteChatById = async (chatId) => {
        const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
            method: "DELETE",
            credentials: "include"
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to delete chat");
        }
        if (activeChatId === chatId) {
            newChat();
        }
        await loadChats();
    };

    const duplicateChatById = async (chatId) => {
        const response = await fetch(`${API_BASE_URL}/chat/${chatId}/duplicate`, {
            method: "POST",
            credentials: "include"
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to duplicate chat");
        }
        await loadChats();
    };

    const loadChat = async (chatId) => {
        if (chatLoading && chatId === activeChatId) {
            return;
        }

        try {
            setActiveChatId(chatId);
            setChatLoading(true);
            setShowResult(true);
            setMessages([]);
            setResultData("");
            const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
                credentials: "include"
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to load chat");
            }
            setMessages(data.messages);
            setShowResult(data.messages.length > 0);
            setRecentPrompt(data.chat.title);
            setResultData("");
            setSelectedImages([]);
        } catch (error) {
            console.error("loadChat error:", error);
        } finally {
            setChatLoading(false);
        }
    };

    const newChat = () => {
        setActiveChatId(null);
        setMessages([]);
        setLoading(false);
        setChatLoading(false);
        setShowResult(false);
        setResultData("");
        setInput("");
        setRecentPrompt("");
        setSelectedImages([]);
    };

    const onSent = async (prompt) => {
        const finalPrompt = (prompt !== undefined ? prompt : input).trim();

        if (!finalPrompt && selectedImages.length === 0) {
            return;
        }

        setLoading(true);
        setShowResult(true);
        setResultData("");
        setRecentPrompt(finalPrompt || selectedImages.map((image) => image.name).join(", ") || "Image analysis");
        setPrevPrompt((prev) => finalPrompt ? [...prev, finalPrompt] : prev);

        const optimisticUserMessage = {
            _id: `local-${Date.now()}`,
            role: "user",
            content: finalPrompt || "Analyze the uploaded image.",
            attachments: selectedImages.map((image) => ({
                type: "image",
                fileName: image.name
            }))
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);

        try {
            const response = selectedImages.length > 0
                ? await sendImageMessage(finalPrompt)
                : await sendTextMessage(finalPrompt);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Request failed");
            }

            let answer = data.data;
            if (Array.isArray(data.sources) && data.sources.length > 0) {
                const sourceText = data.sources
                    .map((source) => `${source.label}: ${source.fileName} (chunk ${source.chunkIndex + 1})`)
                    .join("<br>");
                answer = `${answer}<br><br><strong>Sources</strong><br>${sourceText}`;
            }

            const assistantMessage = {
                ...data.message,
                content: ""
            };

            setActiveChatId(data.chat._id);
            setMessages((prev) => [...prev.filter((message) => message._id !== optimisticUserMessage._id), optimisticUserMessage, assistantMessage]);
            streamAssistantMessage(data.message._id, answer);
            setInput("");
            setSelectedImages([]);
            await loadChats();
        } catch (err) {
            console.error("onSent error:", err);
            setMessages((prev) => [...prev, {
                _id: `error-${Date.now()}`,
                role: "assistant",
                content: err.message || "Something went wrong..."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const sendTextMessage = (finalPrompt) => {
        return fetch(`${API_BASE_URL}/chats/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                query: finalPrompt,
                chatId: activeChatId
            })
        });
    };

    const sendImageMessage = (finalPrompt) => {
        const formData = new FormData();
        formData.append("query", finalPrompt || "Analyze these images and explain what you see.");
        if (activeChatId) {
            formData.append("chatId", activeChatId);
        }
        selectedImages.forEach((image) => formData.append("images", image));

        return fetch(`${API_BASE_URL}/chats/message/image`, {
            method: "POST",
            credentials: "include",
            body: formData
        });
    };

    const streamAssistantMessage = (messageId, answer) => {
        const words = String(answer || "").split(" ");
        let index = 0;

        const interval = window.setInterval(() => {
            index += 1;
            const nextContent = words.slice(0, index).join(" ");
            setMessages((prev) => prev.map((message) => (
                message._id === messageId
                    ? { ...message, content: nextContent }
                    : message
            )));

            if (index >= words.length) {
                window.clearInterval(interval);
            }
        }, 35);
    };

    const contextValue = {
        prevPrompt,
        setPrevPrompt,
        onSent,
        recentPrompt,
        setRecentPrompt,
        showResult,
        setShowResult,
        loading,
        chatLoading,
        resultData,
        setResultData,
        input,
        setInput,
        newChat,
        chats,
        activeChatId,
        messages,
        loadChat,
        loadChats,
        updateChat,
        deleteChatById,
        duplicateChatById,
        selectedImages,
        setSelectedImages
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;
