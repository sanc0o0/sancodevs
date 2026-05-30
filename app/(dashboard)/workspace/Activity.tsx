"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import { TabSkeleton } from "./Joined";
import type { WsNotification } from "./types";

export default function Activity({ userId }: { userId: string }) {
    const [items, setItems] = useState<WsNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    async function load(cursor?: string) {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/workspace/activity?${params}`);
        return res.json();
    }

    useEffect(() => {
        load().then(({ data, nextCursor }) => {
            setItems(data);
            setNextCursor(nextCursor);
            setLoading(false);
        });
    }, []);

    async function loadMore() {
        if (!nextCursor) return;
        setLoadingMore(true);
        const { data, nextCursor: nc } = await load(nextCursor);
        setItems((prev) => [...prev, ...data]);
        setNextCursor(nc);
        setLoadingMore(false);
    }

    async function markAllRead() {
        await fetch("/api/notifications/real-all", { method: "POST" });
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    if (loading) return <TabSkeleton />;

    if (items.length === 0) {
        return (
            <WsEmptyState
                icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                title="No activity yet"
                subtitle="Notifications from your projects and collaborators will appear here."
            />
        );
    }

    const unreadCount = items.filter((n) => !n.read).length;

    // Group by date
    const groups = groupByDate(items);

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        style={{ fontSize: "11px", color: "var(--muted)", background: "transparent", border: "0.5px solid var(--border)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {groups.map(({ label, items: groupItems }) => (
                    <div key={label}>
                        <p style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                            {label}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                            {groupItems.map((notif) => (
                                <NotifRow key={notif.id} notif={notif} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {nextCursor && (
                <button onClick={loadMore} disabled={loadingMore}
                    style={{ marginTop: "14px", width: "100%", padding: "8px", fontSize: "11px", color: "var(--muted)", background: "transparent", border: "0.5px solid var(--border)", borderRadius: "7px", cursor: "pointer" }}>
                    {loadingMore ? "Loading..." : "Load more"}
                </button>
            )}
        </div>
    );
}

function NotifRow({ notif }: { notif: WsNotification }) {
    const inner = (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: notif.read ? "transparent" : "var(--surface)", border: notif.read ? "0.5px solid transparent" : "0.5px solid var(--border)", transition: "background 0.15s" }}>
            {/* Unread dot */}
            <span style={{ marginTop: "4px", width: "5px", height: "5px", borderRadius: "50%", background: notif.read ? "transparent" : "var(--text)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: "var(--text)", fontWeight: notif.read ? 400 : 500, marginBottom: "2px" }}>
                    {notif.title}
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>
                    {notif.body}
                </p>
                <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                    {relativeTime(notif.createdAt)}
                </p>
            </div>
        </div>
    );

    if (notif.href) {
        return (
            <Link href={notif.href} style={{ textDecoration: "none" }}>
                {inner}
            </Link>
        );
    }
    return inner;
}

function groupByDate(items: WsNotification[]) {
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today); 
    yesterday.setDate(today.getDate() - 1);

    const thisWeek = new Date(today); 
    thisWeek.setDate(today.getDate() - 7);

    const buckets: Record<string, WsNotification[]> = {
        Today: [], Yesterday: [], "This week": [], Older: [],
    };

    for (const item of items) {
        const d = new Date(item.createdAt); d.setHours(0, 0, 0, 0);
        if (d >= today) buckets["Today"].push(item);
        else if (d >= yesterday) buckets["Yesterday"].push(item);
        else if (d >= thisWeek) buckets["This week"].push(item);
        else buckets["Older"].push(item);
    }

    return Object.entries(buckets)
        .filter(([, v]) => v.length > 0)
        .map(([label, items]) => ({ label, items }));
}

function relativeTime(date: string | Date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
}