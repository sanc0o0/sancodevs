"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Reaction = { emoji: string; userIds: string[] };
type Receipt = { userId: string };
type Message = {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    createdAt: string;
    userId: string;
    user: { id: string; name: string | null; image: string | null };
    reactions?: Reaction[];
    receipts?: Receipt[];
};

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🔥", "👀", "✅"];

interface Props {
    groupId: string;
    initialMessages: Message[];
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string | null;
}

export default function ChatWindow({
    groupId,
    initialMessages,
    currentUserId,
    currentUserName,
    currentUserImage,
}: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [reactions, setReactions] = useState<Record<string, Reaction[]>>(() => {
        const init: Record<string, Reaction[]> = {};
        initialMessages.forEach(m => { init[m.id] = m.reactions ?? []; });
        return init;
    });
    const [statuses, setStatuses] = useState<Record<string, "sending" | "sent" | "failed">>({});
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [hovered, setHovered] = useState<string | null>(null);
    const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isNearBottomRef = useRef(true);
    const lastMessageCountRef = useRef(initialMessages.length);
    const [initialCount] = useState(initialMessages.length);

    // Track if user is near bottom
    function handleScroll() {
        const el = scrollRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = distFromBottom < 80;
        if (isNearBottomRef.current) setNewMessageCount(0);
    }

    // Scroll to bottom only when near bottom
    function scrollToBottom(force = false) {
        if (force || isNearBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setNewMessageCount(0);
        }
    }

    // Initial scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/community/messages?groupId=${groupId}`);
            if (!res.ok) return;
            const data: Message[] = await res.json();

            setMessages(prev => {
                const prevCount = prev.filter(m => !m.id.startsWith("temp-")).length;
                const newCount = data.length;
                const added = newCount - prevCount;

                if (added > 0) {
                    const newMsgs = data.slice(-added);
                    const fromOthers = newMsgs.filter(m => m.userId !== currentUserId);
                    if (fromOthers.length > 0) {
                        if (!isNearBottomRef.current) {
                            setNewMessageCount(c => c + fromOthers.length);
                            setFirstUnreadId(fromOthers[0].id);
                        }
                    }
                    if (isNearBottomRef.current) {
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                    }
                }

                lastMessageCountRef.current = newCount;
                return data;
            });

            setReactions(prev => {
                const next = { ...prev };
                data.forEach(m => {
                    if (!next[m.id]) next[m.id] = m.reactions ?? [];
                    else next[m.id] = m.reactions ?? next[m.id];
                });
                return next;
            });
        } catch { }
    }, [groupId, currentUserId]);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Mark messages as seen
    useEffect(() => {
        const ids = messages
            .filter(m => m.userId !== currentUserId && !m.id.startsWith("temp-"))
            .map(m => m.id);
        if (!ids.length) return;
        fetch("/api/community/messages/seen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: ids }),
        }).catch(() => { });
    }, [messages, currentUserId]);

    function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
    }

    function removeMedia() {
        setMediaFile(null);
        setMediaPreview(null);
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if ((!content.trim() && !mediaFile) || sending) return;
        setSending(true);

        let mediaUrl: string | null = null;
        let mediaType: string | null = null;

        if (mediaFile) {
            setUploading(true);
            try {
                const fd = new FormData();
                fd.append("file", mediaFile);
                const res = await fetch("/api/community/upload", { method: "POST", body: fd });
                const data = await res.json();
                mediaUrl = data.url;
                mediaType = data.type;
            } catch {
                setSending(false);
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        const tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
            id: tempId,
            content: content.trim() || null,
            mediaUrl,
            mediaType,
            createdAt: new Date().toISOString(),
            userId: currentUserId,
            user: { id: currentUserId, name: currentUserName, image: currentUserImage },
            reactions: [],
            receipts: [],
        };

        setMessages(prev => [...prev, optimistic]);
        setReactions(prev => ({ ...prev, [tempId]: [] }));
        setStatuses(prev => ({ ...prev, [tempId]: "sending" }));
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);

        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

        try {
            await fetch("/api/community/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId, content: content.trim() || null, mediaUrl, mediaType }),
            });
            setStatuses(prev => ({ ...prev, [tempId]: "sent" }));
            await fetchMessages();
        } catch {
            setStatuses(prev => ({ ...prev, [tempId]: "failed" }));
        }
        setSending(false);
        inputRef.current?.focus();
    }

    async function deleteMessage(id: string) {
        setMessages(prev => prev.filter(m => m.id !== id));
        await fetch(`/api/community/messages/${id}`, { method: "DELETE" });
    }

    async function saveEdit(id: string) {
        if (!editContent.trim()) return;
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editContent.trim() } : m));
        setEditingId(null);
        await fetch(`/api/community/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent.trim() }),
        });
    }

    async function toggleReaction(messageId: string, emoji: string) {
        setReactions(prev => {
            const current = prev[messageId] ?? [];
            const existing = current.find(r => r.emoji === emoji);
            let updated: Reaction[];
            if (existing) {
                const hasReacted = existing.userIds.includes(currentUserId);
                updated = current
                    .map(r => r.emoji === emoji
                        ? {
                            ...r, userIds: hasReacted
                                ? r.userIds.filter(id => id !== currentUserId)
                                : [...r.userIds, currentUserId]
                        }
                        : r
                    )
                    .filter(r => r.userIds.length > 0);
            } else {
                updated = [...current, { emoji, userIds: [currentUserId] }];
            }
            return { ...prev, [messageId]: updated };
        });
        setEmojiPickerFor(null);
        await fetch(`/api/community/messages/${messageId}/react`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
        });
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 pt-4">
            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-2.5 min-h-0"
            >
                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-[var(--muted)]">No messages yet. Say hello.</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.userId === currentUserId;
                    const isTemp = msg.id.startsWith("temp-");
                    const prevMsg = messages[i - 1];
                    const showHeader = !prevMsg || prevMsg.userId !== msg.userId ||
                        (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) > 5 * 60 * 1000;
                    const isEditing = editingId === msg.id;
                    const msgReactions = reactions[msg.id] ?? [];
                    const status = statuses[msg.id];
                    const seenByOthers = (msg.receipts ?? []).some(r => r.userId !== currentUserId);
                    const isFirstUnread = msg.id === firstUnreadId;
                    const isNewFromOther = !isMe && i >= initialCount;

                    return (
                        <div key={msg.id}>
                            {/* New messages divider */}
                            {isFirstUnread && (
                                <div className="flex items-center gap-3 my-3">
                                    <div className="flex-1 h-px bg-[var(--border)]" />
                                    <span className="text-[10px] text-[var(--muted)] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] whitespace-nowrap">
                                        New messages
                                    </span>
                                    <div className="flex-1 h-px bg-[var(--border)]" />
                                </div>
                            )}

                            <div
                                onMouseEnter={() => setHovered(msg.id)}
                                onMouseLeave={() => { setHovered(null); setEmojiPickerFor(null); }}
                                className={`flex gap-2 items-end relative ${isMe ? "flex-row-reverse" : "flex-row"} ${showHeader ? "mt-3" : "mt-0.5"} ${isNewFromOther ? "animate-pulse-once" : ""}`}
                            >
                                {/* Avatar */}
                                {!isMe && (
                                    showHeader ? (
                                        <div className="w-7 h-7 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] text-[var(--text)] self-end">
                                            {msg.user.image
                                                ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                                                : msg.user.name?.charAt(0)
                                            }
                                        </div>
                                    ) : (
                                        <div className="w-7 flex-shrink-0" />
                                    )
                                )}

                                {/* Bubble */}
                                <div className={`max-w-[65%] min-w-0 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    {showHeader && !isMe && (
                                        <p className="text-[10px] text-[var(--muted)] mb-0.5 pl-0.5">
                                            {msg.user.name}
                                        </p>
                                    )}

                                    {isEditing ? (
                                        <div className="flex flex-col gap-1.5">
                                            <textarea
                                                title="Edit message"
                                                aria-label="Edit message"
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                className="form-input text-sm resize-none w-60"
                                                rows={2}
                                                autoFocus
                                            />
                                            <div className="flex gap-1.5">
                                                <button onClick={() => saveEdit(msg.id)} className="px-3 py-1 rounded-md text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer">Save</button>
                                                <button onClick={() => setEditingId(null)} className="px-2.5 py-1 rounded-md text-xs text-[var(--muted)] border border-[var(--border)] bg-transparent cursor-pointer">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Media */}
                                            {msg.mediaUrl && (
                                                <div className="mb-1 rounded-lg overflow-hidden max-w-[240px]">
                                                    {msg.mediaType === "image"
                                                        ? <img src={msg.mediaUrl} alt="media" className="w-full h-auto rounded-lg" loading="lazy" />
                                                        : <video src={msg.mediaUrl} controls className="w-full rounded-lg" />
                                                    }
                                                </div>
                                            )}

                                            {/* Text bubble */}
                                            {msg.content && (
                                                <div className={`px-3 py-2 rounded-[10px] text-sm leading-relaxed break-words whitespace-pre-wrap
                                                    ${isMe
                                                        ? "bg-[var(--accent)] text-[var(--bg)] rounded-br-[3px]"
                                                        : `bg-[var(--surface2)] text-[var(--text)] rounded-bl-[3px] ${isNewFromOther ? "ring-1 ring-[var(--accent)] ring-opacity-30" : ""}`
                                                    }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reactions */}
                                    {msgReactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {msgReactions.map(r => (
                                                <button
                                                    key={r.emoji}
                                                    onClick={() => toggleReaction(msg.id, r.emoji)}
                                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border cursor-pointer transition-all
                                                        ${r.userIds.includes(currentUserId)
                                                            ? "border-[var(--accent)] bg-[var(--surface2)]"
                                                            : "border-[var(--border)] bg-transparent"
                                                        }`}
                                                >
                                                    {r.emoji}
                                                    <span className="text-[11px] text-[var(--muted)]">{r.userIds.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Timestamp + status */}
                                    <div className={`flex items-center gap-1.5 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                        <p className="text-[10px] text-[var(--muted)]">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                        {isMe && (
                                            <span className={`text-[10px] ${seenByOthers ? "text-green-500" : status === "failed" ? "text-red-400" : "text-[var(--muted)]"}`}>
                                                {isTemp
                                                    ? status === "sending" ? "·" : status === "failed" ? "Failed ✕" : "✓"
                                                    : seenByOthers ? "Seen ✓✓" : "✓"
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Hover actions */}
                                {hovered === msg.id && !isEditing && (
                                    <div className={`flex items-center gap-1 self-center relative ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                                        <div className="relative">
                                            <button
                                                onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)}
                                                className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs flex items-center justify-center"
                                                title="React"
                                            >😊</button>
                                            {emojiPickerFor === msg.id && (
                                                <div className={`absolute bottom-8 ${isMe ? "right-0" : "left-0"} flex flex-wrap gap-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] z-10 w-40`}>
                                                    {EMOJI_OPTIONS.map(e => (
                                                        <button key={e} onClick={() => toggleReaction(msg.id, e)} className="bg-none border-none cursor-pointer text-lg p-0.5 rounded hover:bg-[var(--surface2)]">{e}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isMe && (
                                            <>
                                                <button
                                                    onClick={() => { setEditingId(msg.id); setEditContent(msg.content ?? ""); }}
                                                    className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] cursor-pointer flex items-center justify-center text-[var(--muted)]"
                                                    title="Edit"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteMessage(msg.id)}
                                                    className="w-6 h-6 rounded-md border border-red-400/20 bg-[var(--surface)] cursor-pointer flex items-center justify-center text-red-400"
                                                    title="Delete"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* New messages jump button */}
            {newMessageCount > 0 && (
                <button
                    onClick={() => { scrollToBottom(true); setFirstUnreadId(null); }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--bg)] text-xs font-medium shadow-lg border-none cursor-pointer z-10 transition-all hover:opacity-90"
                >
                    ↓ {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
                </button>
            )}

            {/* Media preview */}
            {mediaPreview && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] rounded-lg border border-[var(--border)] mb-2">
                    {mediaFile?.type.startsWith("image/")
                        ? <img src={mediaPreview} alt="preview" className="h-12 w-12 object-cover rounded" />
                        : <video src={mediaPreview} className="h-12 w-16 object-cover rounded" />
                    }
                    <span className="text-xs text-[var(--muted)] flex-1 truncate">{mediaFile?.name}</span>
                    <button onClick={removeMedia} className="text-[var(--muted)] text-base bg-none border-none cursor-pointer">×</button>
                </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2 items-end flex-shrink-0">
                <label className="flex-shrink-0 w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent flex items-center justify-center cursor-pointer text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" aria-label="Upload image or video"/>
                </label>
                <textarea
                    ref={inputRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={uploading ? "Uploading..." : "Write a message... (Enter to send)"}
                    rows={2}
                    className="form-input flex-1 resize-none text-sm"
                    disabled={uploading}
                />
                <button
                    type="submit"
                    disabled={sending || (!content.trim() && !mediaFile) || uploading}
                    className="flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {uploading ? "Uploading..." : sending ? "..." : "Send"}
                </button>
            </form>
        </div>
    );
}