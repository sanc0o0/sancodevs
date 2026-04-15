"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function MessageInput({ groupId }: { groupId: string }) {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;
        setLoading(true);
        await fetch("/api/community/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId, content: content.trim() }),
        });
        setContent("");
        setLoading(false);
        router.refresh();
        inputRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{
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
            <button type="submit" disabled={loading || !content.trim()} style={{
                padding: "9px 16px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                border: "none", cursor: (loading || !content.trim()) ? "not-allowed" : "pointer",
                opacity: (loading || !content.trim()) ? 0.5 : 1, flexShrink: 0,
            }}>
                Send
            </button>
        </form>
    );
}