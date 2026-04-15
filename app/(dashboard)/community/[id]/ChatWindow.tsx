"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Reaction = { emoji: string; userIds: string[] };
type Receipt = { userId: string };
type Message = {
    id: string;
    content: string;
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
        const initial: Record<string, Reaction[]> = {};
        initialMessages.forEach(m => { initial[m.id] = m.reactions ?? []; });
        return initial;
    });
    const [statuses, setStatuses] = useState<Record<string, "sending" | "sent" | "failed">>({});
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [hovered, setHovered] = useState<string | null>(null);
    const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/community/messages?groupId=${groupId}`);
            if (!res.ok) return;
            const data: Message[] = await res.json();
            setMessages(data);
            // Update reactions from server (source of truth)
            setReactions(prev => {
                const next = { ...prev };
                data.forEach(m => {
                    // Only update if not currently in an optimistic state
                    next[m.id] = m.reactions ?? [];
                });
                return next;
            });
        } catch { }
    }, [groupId]);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Mark incoming messages as seen
    useEffect(() => {
        const ids = messages
            .filter(m => m.userId !== currentUserId && !m.id.startsWith("temp-"))
            .map(m => m.id);
        if (ids.length === 0) return;
        fetch("/api/community/messages/seen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: ids }),
        }).catch(() => { });
    }, [messages, currentUserId]);

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() || sending) return;
        setSending(true);
        const tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
            id: tempId,
            content: content.trim(),
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
        try {
            await fetch("/api/community/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId, content: optimistic.content }),
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
            if (existing) {
                const hasReacted = existing.userIds.includes(currentUserId);
                const updated = current
                    .map(r => r.emoji === emoji
                        ? {
                            ...r, userIds: hasReacted
                                ? r.userIds.filter(id => id !== currentUserId)
                                : [...r.userIds, currentUserId]
                        }
                        : r
                    )
                    .filter(r => r.userIds.length > 0);
                return { ...prev, [messageId]: updated };
            }
            return { ...prev, [messageId]: [...current, { emoji, userIds: [currentUserId] }] };
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
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, paddingTop: "1rem" }}>
            {/* Messages area */}
            <div style={{
                flex: 1, overflowY: "auto", overflowX: "hidden",
                display: "flex", flexDirection: "column", gap: "2px",
                padding: "1rem", borderRadius: "11px",
                border: "0.5px solid var(--border)", background: "var(--surface)",
                marginBottom: "10px", minHeight: 0,
            }}>
                {messages.length === 0 && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>No messages yet. Say hello.</p>
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

                    // Seen status from receipts
                    const seenByOthers = (msg.receipts ?? []).some(r => r.userId !== currentUserId);

                    return (
                        <div
                            key={msg.id}
                            onMouseEnter={() => setHovered(msg.id)}
                            onMouseLeave={() => { setHovered(null); setEmojiPickerFor(null); }}
                            style={{
                                display: "flex", gap: "8px",
                                flexDirection: isMe ? "row-reverse" : "row",
                                alignItems: "flex-end",
                                marginTop: showHeader ? "12px" : "1px",
                                position: "relative",
                            }}
                        >
                            {/* Avatar */}
                            {!isMe && (
                                showHeader ? (
                                    <div style={{
                                        width: "28px", height: "28px", borderRadius: "50%",
                                        background: "var(--surface2)", border: "0.5px solid var(--border)",
                                        overflow: "hidden", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "10px", color: "var(--text)",
                                        alignSelf: "flex-end",
                                    }}>
                                        {msg.user.image
                                            ? <img src={msg.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : msg.user.name?.charAt(0)
                                        }
                                    </div>
                                ) : (
                                    <div style={{ width: "28px", flexShrink: 0 }} />
                                )
                            )}

                            {/* Bubble + metadata */}
                            <div style={{ maxWidth: "65%", minWidth: 0, display: "flex", flexDirection: "column" }}>
                                {showHeader && !isMe && (
                                    <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "3px", paddingLeft: "2px" }}>
                                        {msg.user.name}
                                    </p>
                                )}

                                {isEditing ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <textarea
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                            className="form-input"
                                            rows={2}
                                            title=" Edit message input"
                                            aria-label="Edit message input"
                                            style={{ resize: "none", fontSize: "13px", width: "240px" }}
                                            autoFocus
                                        />
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button onClick={() => saveEdit(msg.id)} style={{
                                                padding: "4px 12px", borderRadius: "6px", fontSize: "12px",
                                                background: "var(--accent)", color: "var(--bg)",
                                                border: "none", cursor: "pointer",
                                            }}>Save</button>
                                            <button onClick={() => setEditingId(null)} style={{
                                                padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                                                background: "transparent", color: "var(--muted)",
                                                border: "0.5px solid var(--border)", cursor: "pointer",
                                            }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: "8px 12px", borderRadius: "10px",
                                        background: isMe ? "var(--accent)" : "var(--surface2)",
                                        color: isMe ? "var(--bg)" : "var(--text)",
                                        fontSize: "13px", lineHeight: 1.5,
                                        wordBreak: "break-word", overflowWrap: "break-word",
                                        whiteSpace: "pre-wrap",
                                        borderBottomRightRadius: isMe ? "3px" : "10px",
                                        borderBottomLeftRadius: isMe ? "10px" : "3px",
                                    }}>
                                        {msg.content}
                                    </div>
                                )}

                                {/* Reactions */}
                                {msgReactions.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                        {msgReactions.map(r => (
                                            <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)} style={{
                                                padding: "2px 7px", borderRadius: "20px", fontSize: "12px",
                                                border: `0.5px solid ${r.userIds.includes(currentUserId) ? "var(--accent)" : "var(--border)"}`,
                                                background: r.userIds.includes(currentUserId) ? "var(--surface2)" : "transparent",
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: "3px",
                                            }}>
                                                {r.emoji}
                                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{r.userIds.length}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Timestamp + status */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    marginTop: "3px",
                                    justifyContent: isMe ? "flex-end" : "flex-start",
                                }}>
                                    <p style={{ fontSize: "10px", color: "var(--muted)" }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    {isMe && (
                                        <span style={{ fontSize: "10px", color: seenByOthers ? "#22c55e" : status === "failed" ? "#e24b4a" : "var(--muted)" }}>
                                            {isTemp
                                                ? status === "sending" ? "·" : status === "failed" ? "Failed ✕" : "✓"
                                                : seenByOthers ? "Seen ✓✓" : "Delivered ✓"
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hover actions */}
                            {hovered === msg.id && !isEditing && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "4px",
                                    flexDirection: isMe ? "row" : "row-reverse",
                                    alignSelf: "center", position: "relative",
                                }}>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)}
                                            title="React"
                                            style={{
                                                width: "26px", height: "26px", borderRadius: "6px",
                                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                                cursor: "pointer", fontSize: "13px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}
                                        >
                                            😊
                                        </button>
                                        {emojiPickerFor === msg.id && (
                                            <div style={{
                                                position: "absolute", bottom: "32px",
                                                ...(isMe ? { right: 0 } : { left: 0 }),
                                                display: "flex", gap: "4px",
                                                padding: "6px 8px", borderRadius: "10px",
                                                border: "0.5px solid var(--border)",
                                                background: "var(--surface)", zIndex: 10,
                                                flexWrap: "wrap", width: "160px",
                                            }}>
                                                {EMOJI_OPTIONS.map(e => (
                                                    <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{
                                                        background: "none", border: "none",
                                                        cursor: "pointer", fontSize: "18px",
                                                        padding: "2px", borderRadius: "4px",
                                                    }}>{e}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isMe && (
                                        <>
                                            <button
                                                onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                                                title="Edit"
                                                style={{
                                                    width: "26px", height: "26px", borderRadius: "6px",
                                                    border: "0.5px solid var(--border)", background: "var(--surface)",
                                                    cursor: "pointer", color: "var(--muted)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}
                                            >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteMessage(msg.id)}
                                                title="Delete"
                                                style={{
                                                    width: "26px", height: "26px", borderRadius: "6px",
                                                    border: "0.5px solid #e24b4a33", background: "var(--surface)",
                                                    cursor: "pointer", color: "#e24b4a",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}
                                            >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4h6v2" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{
                display: "flex", gap: "8px", alignItems: "flex-end", flexShrink: 0,
            }}>
                <textarea
                    ref={inputRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="form-input"
                    style={{ flex: 1, resize: "none", fontSize: "13px" }}
                />
                <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    style={{
                        padding: "10px 20px", borderRadius: "8px", fontSize: "13px",
                        fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                        border: "none",
                        cursor: (sending || !content.trim()) ? "not-allowed" : "pointer",
                        opacity: (sending || !content.trim()) ? 0.5 : 1,
                        flexShrink: 0, transition: "opacity 0.15s",
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
}