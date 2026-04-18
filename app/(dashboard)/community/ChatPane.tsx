"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getPusherClient } from "@/lib/pusher-client";

type Reaction = { emoji: string; userIds: string[] };
type Message = {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    createdAt: string;
    userId: string;
    deleted?: boolean;
    user: { id: string; name: string | null; image: string | null };
    reactions?: Reaction[];
    receipts?: { userId: string }[];
};
type TypingUser = { userId: string; userName: string | null };

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🔥", "👀", "✅"];

export interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    muted: boolean;
    pinned: boolean;
}

interface Props {
    group: Group;
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string | null;
    onOpenDetails: () => void;
    onBack: () => void;
}

export default function ChatPane({
    group, currentUserId, currentUserName, currentUserImage, onOpenDetails, onBack,
}: Props) {
    // ── Single source of truth: Map<id, Message> ──────────────────────────
    const [msgMap, setMsgMap] = useState<Map<string, Message>>(new Map());
    const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [hovered, setHovered] = useState<string | null>(null);
    const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [newMsgCount, setNewMsgCount] = useState(0);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const [notAllowed, setNotAllowed] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isNearBottomRef = useRef(true);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seenDebounceRef = useRef<NodeJS.Timeout | null>(null);
    // Track IDs we sent ourselves so Pusher echo doesn't duplicate
    const sentIdsRef = useRef<Set<string>>(new Set());
    const initialLoadedRef = useRef(false);
    const groupIdRef = useRef(group.id);

    // Derive ordered array from map (memoized)
    const messages = useMemo(() =>
        Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
        [msgMap]
    );

    // ── Helpers ────────────────────────────────────────────────────────────
    function upsertMessage(msg: Message) {
        setMsgMap(prev => {
            const next = new Map(prev);
            next.set(msg.id, msg);
            return next;
        });
        setReactions(prev => ({ ...prev, [msg.id]: msg.reactions ?? prev[msg.id] ?? [] }));
    }

    function deleteFromMap(id: string) {
        setMsgMap(prev => {
            const next = new Map(prev);
            const existing = next.get(id);
            if (existing) next.set(id, { ...existing, content: null, deleted: true });
            return next;
        });
    }

    function updateInMap(id: string, updates: Partial<Message>) {
        setMsgMap(prev => {
            if (!prev.has(id)) return prev;
            const next = new Map(prev);
            next.set(id, { ...prev.get(id)!, ...updates });
            return next;
        });
    }

    function removeTempAndInsert(tempId: string, real: Message) {
        setMsgMap(prev => {
            const next = new Map(prev);
            next.delete(tempId);
            next.set(real.id, real);
            return next;
        });
        setReactions(prev => {
            const next = { ...prev };
            const tempReactions = next[tempId] ?? [];
            delete next[tempId];
            next[real.id] = real.reactions ?? tempReactions;
            return next;
        });
    }

    function scrollToBottom(force = false) {
        if (force || isNearBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setNewMsgCount(0);
            setFirstUnreadId(null);
        }
    }

    function handleScroll() {
        const el = scrollRef.current;
        if (!el) return;
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = dist < 100;
        if (isNearBottomRef.current) { setNewMsgCount(0); setFirstUnreadId(null); }
    }

    // ── Load messages when group changes ───────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function loadMessages() {
            setLoading(true);

            try {
                const res = await fetch(`/api/community/messages?groupId=${group.id}`);

                // ❗ HANDLE 403
                if (res.status === 403) {
                    setNotAllowed(true);
                    setMsgMap(new Map());
                    setReactions({});
                    setLoading(false);
                    return;
                }

                setNotAllowed(false);

                const data: Message[] = await res.json();

                if (cancelled) return;

                const map = new Map<string, Message>();
                const rxns: Record<string, Reaction[]> = {};

                data.forEach(m => {
                    map.set(m.id, m);
                    rxns[m.id] = m.reactions ?? [];
                });

                setMsgMap(map);
                setReactions(rxns);

            } catch {
                if (!cancelled) {
                    setMsgMap(new Map());
                    setReactions({});
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    initialLoadedRef.current = true;
                }
            }
        }

        loadMessages();

        return () => { cancelled = true };
    }, [group.id]);

    // ── Pusher subscriptions ───────────────────────────────────────────────
    useEffect(() => {
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`group-${group.id}`);

        channel.bind("message:new", (msg: Message) => {
            if (groupIdRef.current !== group.id) return;

            // If this is our own message that we already added optimistically, skip
            if (sentIdsRef.current.has(msg.id)) {
                sentIdsRef.current.delete(msg.id);
                return;
            }

            // Check if we already have this message (dedup)
            setMsgMap(prev => {
                if (prev.has(msg.id)) return prev; // already exists, skip
                const next = new Map(prev);
                next.set(msg.id, msg);
                return next;
            });
            setReactions(prev => ({ ...prev, [msg.id]: msg.reactions ?? [] }));

            const isFromOther = msg.userId !== currentUserId;
            if (isFromOther && !isNearBottomRef.current) {
                setNewMsgCount(c => c + 1);
                setFirstUnreadId(id => id ?? msg.id);
            }
            if (isNearBottomRef.current) {
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
        });

        channel.bind("message:updated", ({ id, content }: { id: string; content: string }) => {
            updateInMap(id, { content });
        });

        channel.bind("message:deleted", ({ id }: { id: string }) => {
            deleteFromMap(id);
        });

        channel.bind("reaction:update", ({ messageId, reactions: r }: { messageId: string; reactions: Reaction[] }) => {
            setReactions(prev => ({ ...prev, [messageId]: r }));
        });

        channel.bind("message:seen:update", ({ userId, messageIds }: { userId: string; messageIds: string[] }) => {
            setMsgMap(prev => {
                const next = new Map(prev);
                messageIds.forEach(id => {
                    const m = next.get(id);
                    if (m) {
                        const filtered = (m.receipts ?? []).filter(r => r.userId !== userId);
                        next.set(id, { ...m, receipts: [...filtered, { userId }] });
                    }
                });
                return next;
            });
        });

        channel.bind("typing:start", (data: TypingUser) => {
            if (data.userId === currentUserId) return;
            setTypingUsers(prev =>
                prev.some(u => u.userId === data.userId) ? prev : [...prev, data]
            );
        });

        channel.bind("typing:stop", ({ userId }: { userId: string }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        });

        channel.bind("member:joined", ({ userName }: { userId: string; userName: string }) => {
            const sysId = `sys-join-${Date.now()}`;
            setMsgMap(prev => {
                const next = new Map(prev);
                next.set(sysId, {
                    id: sysId, content: `${userName} joined`,
                    createdAt: new Date().toISOString(), userId: "system",
                    user: { id: "system", name: "System", image: null },
                } as Message);
                return next;
            });
        });

        channel.bind("member:left", ({ userName }: { userId: string; userName: string }) => {
            const sysId = `sys-left-${Date.now()}`;
            setMsgMap(prev => {
                const next = new Map(prev);
                next.set(sysId, {
                    id: sysId, content: `${userName} left`,
                    createdAt: new Date().toISOString(), userId: "system",
                    user: { id: "system", name: "System", image: null },
                } as Message);
                return next;
            });
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`group-${group.id}`);
        };
    }, [group.id, currentUserId]);

    // ── Debounced seen receipts ────────────────────────────────────────────
    useEffect(() => {
        if (!messages.length || !initialLoadedRef.current) return;
        if (seenDebounceRef.current) clearTimeout(seenDebounceRef.current);
        seenDebounceRef.current = setTimeout(() => {
            const ids = messages
                .filter(m =>
                    m.userId !== currentUserId &&
                    !m.id.startsWith("temp-") &&
                    !m.id.startsWith("sys-")
                )
                .map(m => m.id);
            if (!ids.length) return;
            fetch("/api/community/messages/seen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageIds: ids, groupId: group.id }),
            }).catch(() => { });
        }, 1000); // debounce 1s to avoid spam
        return () => { if (seenDebounceRef.current) clearTimeout(seenDebounceRef.current); };
    }, [messages.length, currentUserId, group.id]);

    // ── Typing indicator (debounced) ───────────────────────────────────────
    const handleTyping = useCallback(() => {
        if (group.muted) return;
        fetch("/api/community/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id, isTyping: true }),
        }).catch(() => { });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            fetch("/api/community/typing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: group.id, isTyping: false }),
            }).catch(() => { });
        }, 2500);
    }, [group.id, group.muted]);

    // ── Send message ───────────────────────────────────────────────────────
    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if ((!content.trim() && !mediaFile) || sending) return;
        setSending(true);

        // Stop typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        fetch("/api/community/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id, isTyping: false }),
        }).catch(() => { });

        let mediaUrl: string | null = null;
        let mediaType: string | null = null;

        if (mediaFile) {
            setUploading(true);
            try {
                const fd = new FormData();
                fd.append("file", mediaFile);
                const res = await fetch("/api/community/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (res.ok) { mediaUrl = data.url; mediaType = data.type; }
                else { setSending(false); setUploading(false); return; }
            } catch { setSending(false); setUploading(false); return; }
            setUploading(false);
        }

        const msgContent = content.trim() || null;
        const tempId = `temp-${Date.now()}-${Math.random()}`;

        // Add optimistic message
        const optimistic: Message = {
            id: tempId, content: msgContent, mediaUrl, mediaType,
            createdAt: new Date().toISOString(), userId: currentUserId,
            user: { id: currentUserId, name: currentUserName, image: currentUserImage },
            reactions: [], receipts: [],
        };
        upsertMessage(optimistic);
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        inputRef.current?.focus();

        try {
            const res = await fetch("/api/community/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: group.id, content: msgContent, mediaUrl, mediaType }),
            });

            if (!res.ok) {
                // Remove optimistic on failure
                setMsgMap(prev => { const next = new Map(prev); next.delete(tempId); return next; });
                setSending(false);
                return;
            }

            const saved: Message = await res.json();

            // Mark this ID so Pusher echo is ignored
            sentIdsRef.current.add(saved.id);

            // Replace temp with real
            removeTempAndInsert(tempId, saved);
        } catch {
            setMsgMap(prev => { const next = new Map(prev); next.delete(tempId); return next; });
        }
        setSending(false);
    }

    // ── Edit/Delete ────────────────────────────────────────────────────────
    async function deleteMessage(id: string) {
        updateInMap(id, { content: null, deleted: true });
        await fetch(`/api/community/messages/${id}`, { method: "DELETE" });
    }

    async function saveEdit(id: string) {
        if (!editContent.trim()) { setEditingId(null); return; }
        updateInMap(id, { content: editContent.trim() });
        setEditingId(null);
        await fetch(`/api/community/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent.trim() }),
        });
    }

    // ── Reactions ──────────────────────────────────────────────────────────
    async function toggleReaction(messageId: string, emoji: string) {
        setReactions(prev => {
            const current = prev[messageId] ?? [];
            const existing = current.find(r => r.emoji === emoji);
            if (existing) {
                const has = existing.userIds.includes(currentUserId);
                return {
                    ...prev,
                    [messageId]: current
                        .map(r => r.emoji === emoji
                            ? {
                                ...r, userIds: has
                                    ? r.userIds.filter(i => i !== currentUserId)
                                    : [...r.userIds, currentUserId]
                            }
                            : r
                        )
                        .filter(r => r.userIds.length > 0),
                };
            }
            return { ...prev, [messageId]: [...current, { emoji, userIds: [currentUserId] }] };
        });
        setEmojiPickerFor(null);
        await fetch(`/api/community/messages/${messageId}/react`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
        });
        // Authoritative update comes via Pusher reaction:update
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    }

    function getColor(name: string) {
        const colors = [
            "bg-orange-500", "bg-blue-500", "bg-green-500",
            "bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-rose-500",
        ];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    
    // ── Render ─────────────────────────────────────────────────────────────
    
    if (!loading && notAllowed) {
        return (
            <div className="p-6 text-sm text-[var(--muted)]">
                You need admin approval to view messages.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[var(--bg)]">

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
                <button
                    title="Go back"
                    type="button"
                    onClick={onBack}
                    className="md:hidden w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--surface2)] transition-colors border-none bg-transparent cursor-pointer"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white ${getColor(group.name)}`}>
                    {group.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate leading-tight">{group.name}</p>
                    <p className="text-[10px] leading-tight mt-0.5">
                        {typingUsers.length > 0 ? (
                            <span className="text-green-500 flex items-center gap-1">
                                <span className="flex gap-0.5">
                                    {[0, 1, 2].map(i => (
                                        <span key={i} className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                                    ))}
                                </span>
                                {typingUsers.map(u => u.userName?.split(" ")[0]).join(", ")} typing
                            </span>
                        ) : (
                            <span className="text-[var(--muted)]">{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
                        )}
                    </p>
                </div>

                <button
                    onClick={onOpenDetails}
                    className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--surface2)] transition-colors border-none bg-transparent cursor-pointer"
                    title="Group info"
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </button>
            </div>
            {/* ── Messages area ── */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 min-h-0"
                style={{ scrollbarWidth: "thin" }}
                >
            
                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center h-32">
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2 h-2 rounded-full bg-[var(--border)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-16">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 ${getColor(group.name)}`}>
                            {group.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-base font-semibold text-[var(--text)] mb-1">{group.name}</p>
                        <p className="text-sm text-[var(--muted)]">Be the first to say something 👋</p>
                    </div>
                )}

                {/* Messages */}
                <div className="flex flex-col">
                    
                    {messages.map((msg, i) => {
                        const isMe = msg.userId === currentUserId;
                        const isSystem = msg.userId === "system" || msg.id.startsWith("sys-");
                        const isDeleted = msg.deleted || (!msg.content && !msg.mediaUrl && !isSystem);
                        const isTemp = msg.id.startsWith("temp-");
                        const prev = messages[i - 1];
                        const next = messages[i + 1];
                        const prevSameSender = prev && !prev.id.startsWith("sys-") &&
                            prev.userId === msg.userId &&
                            new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
                        const nextSameSender = next && !next.id.startsWith("sys-") &&
                            next.userId === msg.userId &&
                            new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;

                        const showAvatar = !isMe && !isSystem && !nextSameSender;
                        const showName = !isMe && !isSystem && !prevSameSender;
                        const isEditing = editingId === msg.id;
                        const msgReactions = reactions[msg.id] ?? [];
                        const seenByOthers = (msg.receipts ?? []).some(r => r.userId !== currentUserId);
                        const isFirstUnread = msg.id === firstUnreadId;
                        
                        // ── System message ──
                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-3">
                                    <span className="text-[10px] text-[var(--muted)] px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }


                        return (
                            <div key={msg.id} className={prevSameSender ? "mt-0.5" : "mt-4"}>
                                {/* Unread divider */}
                                {isFirstUnread && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-[var(--accent)]/25" />
                                        <span className="text-[10px] text-[var(--accent)] px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 font-medium whitespace-nowrap">
                                            New messages
                                        </span>
                                        <div className="flex-1 h-px bg-[var(--accent)]/25" />
                                    </div>
                                )}

                                <div
                                    className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                    onMouseEnter={() => setHovered(msg.id)}
                                    onMouseLeave={() => { setHovered(null); setEmojiPickerFor(null); }}
                                >
                                    {/* Avatar space */}
                                    <div className="flex-shrink-0 w-7">
                                        {showAvatar && (
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ${getColor(msg.user.name ?? "?")}`}>
                                                {msg.user.image
                                                    ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                                                    : msg.user.name?.charAt(0).toUpperCase()
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Bubble + meta */}
                                    <div className={`flex flex-col max-w-[70%] min-w-0 relative ${isMe ? "items-end" : "items-start"}`}>
                                        {/* Sender name */}
                                        {showName && (
                                            <p className="text-[10px] text-[var(--muted)] font-medium mb-1 px-1">
                                                {msg.user.name}
                                            </p>
                                        )}

                                        {/* Edit mode */}
                                        {isEditing ? (
                                            <div className="flex flex-col gap-1.5 w-64">
                                                <textarea
                                                    aria-label="Edit message"
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    className="form-input text-sm resize-none rounded-xl"
                                                    rows={2}
                                                    autoFocus
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id); }
                                                        if (e.key === "Escape") setEditingId(null);
                                                    }}
                                                />
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => saveEdit(msg.id)} className="flex-1 py-1 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium">
                                                        Save
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="flex-1 py-1 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isDeleted ? (
                                            <div className={`px-3 py-2 text-xs text-[var(--muted)] italic border border-[var(--border)] rounded-2xl
                                                ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                                                This message was deleted
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                {/* Media */}
                                                {msg.mediaUrl && (
                                                    <div className={`mb-1 rounded-2xl overflow-hidden border border-[var(--border)] max-w-[220px]
                                                        ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                                                        {msg.mediaType === "image"
                                                            ? <img src={msg.mediaUrl} alt="media" className="w-full h-auto block" loading="lazy" />
                                                            : <video src={msg.mediaUrl} controls className="w-full block max-h-48" />
                                                        }
                                                    </div>
                                                )}

                                                {/* Text bubble */}
                                                {msg.content && (
                                                    <div className={`px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap rounded-2xl transition-opacity
                                                        ${isMe
                                                            ? "bg-[var(--accent)] text-[var(--bg)] rounded-br-sm"
                                                            : "bg-[var(--surface2)] text-[var(--text)] rounded-bl-sm"
                                                        }
                                                        ${isTemp ? "opacity-60" : "opacity-100"}`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                )}

                                                {/* ── Hover action bar — tightly attached ── */}
                                                {hovered === msg.id && !isTemp && (
                                                    <div className={`absolute -top-8 ${isMe ? "right-0" : "left-0"} flex items-center gap-0.5 
                                                        bg-[var(--surface)] border border-[var(--border)] rounded-xl px-1.5 py-1 
                                                        shadow-lg z-20 whitespace-nowrap`}
                                                        style={{ animation: "fadeIn 0.1s ease" }}
                                                    >
                                                        {/* React */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)}
                                                                className="w-6 h-6 flex items-center justify-center text-sm rounded-lg hover:bg-[var(--surface2)] cursor-pointer border-none bg-transparent transition-colors"
                                                                title="React"
                                                            >😊</button>
                                                            {emojiPickerFor === msg.id && (
                                                                <div
                                                                    className={`absolute bottom-8 ${isMe ? "right-0" : "left-0"} flex flex-wrap gap-1 p-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] z-30 w-48 shadow-2xl`}
                                                                    style={{ animation: "fadeIn 0.1s ease" }}
                                                                >
                                                                    {EMOJI_OPTIONS.map(e => (
                                                                        <button
                                                                            key={e}
                                                                            onClick={() => toggleReaction(msg.id, e)}
                                                                            className="text-xl p-1.5 rounded-xl hover:bg-[var(--surface2)] cursor-pointer border-none bg-transparent hover:scale-125 transition-all"
                                                                        >{e}</button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Edit — own messages only */}
                                                        {isMe && (
                                                            <button
                                                                onClick={() => { setEditingId(msg.id); setEditContent(msg.content ?? ""); }}
                                                                className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface2)] cursor-pointer border-none bg-transparent transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Delete — own messages only */}
                                                        {isMe && (
                                                            <button
                                                                onClick={() => deleteMessage(msg.id)}
                                                                className="w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6l-1 14H6L5 6" />
                                                                    <path d="M10 11v6M14 11v6" />
                                                                    <path d="M9 6V4h6v2" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Reactions row */}
                                        {!isDeleted && msgReactions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {msgReactions.map(r => (
                                                    <button
                                                        key={r.emoji}
                                                        onClick={() => toggleReaction(msg.id, r.emoji)}
                                                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-all active:scale-95
                                                            ${r.userIds.includes(currentUserId)
                                                                ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--text)]"
                                                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)] text-[var(--muted)]"
                                                            }`}
                                                    >
                                                        <span>{r.emoji}</span>
                                                        <span className="text-[10px] font-medium">{r.userIds.length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Time + status */}
                                        <div className={`flex items-center gap-1.5 mt-0.5 px-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <span className="text-[10px] text-[var(--muted)]">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            {isMe && !isDeleted && (
                                                <span className={`text-[10px] ${seenByOthers ? "text-green-500" : "text-[var(--muted)]"}`}>
                                                    {isTemp ? "·" : seenByOthers ? "✓✓" : "✓"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Typing bubble */}
                {typingUsers.length > 0 && (
                    <div className="flex items-end gap-2 mt-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--surface2)] flex-shrink-0" />
                        <div className="flex gap-1 px-3 py-2.5 bg-[var(--surface2)] rounded-2xl rounded-bl-sm">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Jump to new messages */}
            {newMsgCount > 0 && (
                <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ position: "absolute" }}>
                    <button
                        onClick={() => scrollToBottom(true)}
                        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--bg)] text-xs font-semibold border-none cursor-pointer shadow-2xl hover:opacity-90 transition-opacity"
                        style={{ animation: "fadeUp 0.2s ease" }}
                    >
                        ↓ {newMsgCount} new message{newMsgCount > 1 ? "s" : ""}
                    </button>
                </div>
            )}

            {/* Media preview strip */}
            {mediaPreview && (
                <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface2)]">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0">
                        {mediaFile?.type.startsWith("image/")
                            ? <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
                            : <video src={mediaPreview} className="w-full h-full object-cover" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text)] truncate font-medium">{mediaFile?.name}</p>
                        <p className="text-[10px] text-[var(--muted)]">{mediaFile?.type.split("/")[0]}</p>
                    </div>
                    <button
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] border-none cursor-pointer text-sm leading-none"
                    >×</button>
                </div>
            )}

            {/* ── Input bar ── */}
            <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                    {/* Attach */}
                    <label className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            title="Attach media"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 20 * 1024 * 1024) return;
                                setMediaFile(file);
                                setMediaPreview(URL.createObjectURL(file));
                                e.target.value = "";
                            }}
                        />
                    </label>

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={content}
                            onChange={e => {
                                setContent(e.target.value);
                                // Auto-resize
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                handleTyping();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={uploading ? "Uploading..." : "Message..."}
                            disabled={uploading}
                            rows={1}
                            className="w-full text-sm bg-[var(--surface2)] rounded-2xl px-4 py-2.5 border border-transparent focus:border-[var(--border)] outline-none text-[var(--text)] placeholder:text-[var(--muted)] resize-none leading-5 transition-colors block"
                            style={{ minHeight: "40px", maxHeight: "120px" }}
                        />
                    </div>

                    {/* Send */}
                    <button
                        type="submit"
                        disabled={sending || (!content.trim() && !mediaFile) || uploading}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:opacity-85 transition-opacity active:scale-95"
                        title="Send"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}