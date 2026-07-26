import React, { memo, useContext, useState } from 'react'
import './SlideBar.css'
import {
    CircleHelp,
    Copy,
    FileText,
    History,
    Image,
    Menu,
    MessageSquare,
    MoreVertical,
    Pencil,
    Pin,
    Search,
    Settings,
    SquarePen,
    Trash2
} from "lucide-react";
import { Context } from '../contest/Context';

const formatRelativeTime = (dateValue) => {
    if (!dateValue) return "Recent";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recent";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.floor((startToday - startDate) / 86400000);

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    if (dayDiff < 7) return `${dayDiff} days ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getChatIcon = (chat) => {
    const text = `${chat.title || ""} ${chat.lastMessage || ""}`.toLowerCase();
    if (text.includes("image") || text.includes("photo") || text.includes("picture")) return Image;
    if (text.includes("pdf") || text.includes("doc") || text.includes("file")) return FileText;
    return MessageSquare;
};

const ChatItem = memo(function ChatItem({
    chat,
    active,
    menuOpen,
    onLoad,
    onToggleMenu,
    onPin,
    onRename,
    onDuplicate,
    onDelete
}) {
    const Icon = getChatIcon(chat);
    const timeLabel = formatRelativeTime(chat.updatedAt || chat.createdAt);
    const title = chat.title || "Untitled chat";

    const stopAction = (event, action) => {
        event.stopPropagation();
        action();
    };

    return (
        <div className={`recent-entry ${active ? "active" : ""}`} onClick={onLoad}>
            <div className="chat-entry-main">
                <Icon className='icon chat-type-icon' size={18} />
                <div className="chat-copy">
                    <p title={title}>{title}</p>
                    <span>{timeLabel}</span>
                </div>
                {chat.isPinned ? <Pin className="pin-badge" size={14} fill="currentColor" /> : null}
            </div>

            <div className="chat-actions desktop-actions" aria-label={`Actions for ${title}`}>
                <button title={chat.isPinned ? "Unpin" : "Pin"} aria-label={chat.isPinned ? "Unpin chat" : "Pin chat"} onClick={(event) => stopAction(event, onPin)}>
                    <Pin size={15} fill={chat.isPinned ? "currentColor" : "none"} />
                </button>
                <button title="Rename" aria-label="Rename chat" onClick={(event) => stopAction(event, onRename)}>
                    <Pencil size={15} />
                </button>
                <button title="Duplicate" aria-label="Duplicate chat" onClick={(event) => stopAction(event, onDuplicate)}>
                    <Copy size={15} />
                </button>
                <button title="Delete" aria-label="Delete chat" onClick={(event) => stopAction(event, onDelete)}>
                    <Trash2 size={15} />
                </button>
            </div>

            <button
                className="mobile-actions-toggle"
                title="Chat actions"
                aria-label="Chat actions"
                onClick={(event) => stopAction(event, onToggleMenu)}
            >
                <MoreVertical size={17} />
            </button>

            {menuOpen ? (
                <div className="mobile-menu" onClick={(event) => event.stopPropagation()}>
                    <button onClick={onPin}><Pin size={15} />{chat.isPinned ? "Unpin" : "Pin"}</button>
                    <button onClick={onRename}><Pencil size={15} />Rename</button>
                    <button onClick={onDuplicate}><Copy size={15} />Duplicate</button>
                    <button onClick={onDelete}><Trash2 size={15} />Delete</button>
                </div>
            ) : null}
        </div>
    );
});

const SlideBar = () => {
    const [extended, setExtended] = useState(false);
    const [search, setSearch] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const {
        chats,
        activeChatId,
        newChat,
        loadChat,
        loadChats,
        updateChat,
        deleteChatById,
        duplicateChatById
    } = useContext(Context)

    const handleSearch = (value) => {
        setSearch(value);
        loadChats(value);
    };

    const handleRename = async (chat) => {
        const title = window.prompt("Rename chat", chat.title);
        if (title === null) return;
        await updateChat(chat._id, { title });
        setOpenMenuId(null);
    };

    const handleDelete = async (chat) => {
        if (!window.confirm(`Delete "${chat.title}"?`)) return;
        await deleteChatById(chat._id);
        setOpenMenuId(null);
    };

    const handleDuplicate = async (chatId) => {
        await duplicateChatById(chatId);
        setOpenMenuId(null);
    };

    const handlePin = async (chat) => {
        await updateChat(chat._id, { isPinned: !chat.isPinned });
        setOpenMenuId(null);
    };

    return (
        <aside className={`slidebar ${extended ? "expanded" : "collapsed"}`} aria-label="Chat navigation">
            <div className='top'>
                <button className='menu_icon icon-button' onClick={() => setExtended(!extended)} aria-label={extended ? "Collapse sidebar" : "Expand sidebar"}>
                    <Menu size={22} />
                </button>
                <button onClick={() => newChat()} className='new-chat'>
                    <SquarePen className='icon' size={20} />
                    {extended ? <span>New Chat</span> : null}
                </button>

                {extended ?
                    <div className='recent'>
                        <div className="recent-heading">
                            <p className='recent-title'>Chats</p>
                            <span>{chats.length}</span>
                        </div>
                        <label className="chat-search">
                            <Search size={16} />
                            <input
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search chats"
                                aria-label="Search chats"
                            />
                        </label>
                        <div className="chat-list">
                            {chats.map((chat) => (
                                <ChatItem
                                    key={chat._id}
                                    chat={chat}
                                    active={activeChatId === chat._id}
                                    menuOpen={openMenuId === chat._id}
                                    onLoad={() => {
                                        setOpenMenuId(null);
                                        loadChat(chat._id);
                                    }}
                                    onToggleMenu={() => setOpenMenuId(openMenuId === chat._id ? null : chat._id)}
                                    onPin={() => handlePin(chat)}
                                    onRename={() => handleRename(chat)}
                                    onDuplicate={() => handleDuplicate(chat._id)}
                                    onDelete={() => handleDelete(chat)}
                                />
                            ))}
                        </div>
                    </div>
                    : null}
            </div>

            <div className='bottom'>
                <div className='bottom-item recent-entry'>
                    <CircleHelp className='icon' size={19} />
                    {extended ? <p>Help</p> : null}
                </div>

                <div className='bottom-item recent-entry'>
                    <History className='icon' size={19} />
                    {extended ? <p>Activity</p> : null}
                </div>

                <div className='bottom-item recent-entry'>
                    <Settings className='icon' size={19} />
                    {extended ? <p>Settings</p> : null}
                </div>
            </div>
        </aside>
    )
}

export default SlideBar
