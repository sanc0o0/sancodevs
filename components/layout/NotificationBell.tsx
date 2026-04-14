"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    body: string;
    href: string | null;
    read: boolean;
    createdAt: string;
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/notifications")
            .then(r => r.json())
            .then(d => Array.isArray(d) && setNotifications(d))
            .catch(() => { });
    }, []);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function markRead(id: string) {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }

    const unread = notifications.filter(n => !n.read).length;

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "34px", height: "34px", borderRadius: "8px",
                    border: "0.5px solid var(--border)", background: "transparent",
                    color: "var(--text)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: "5px", right: "5px",
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#e24b4a", border: "1.5px solid var(--bg)",
                    }} />
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    width: "300px", borderRadius: "10px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                    zIndex: 50, overflow: "hidden",
                    animation: "fadeIn 0.12s ease",
                }}>
                    <div style={{ padding: "10px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Notifications</p>
                        {unread > 0 && (
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{unread} unread</span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--muted)" }}>No notifications yet</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    style={{
                                        padding: "12px 14px",
                                        borderBottom: "0.5px solid var(--border)",
                                        background: n.read ? "transparent" : "var(--surface2)",
                                        cursor: "pointer", transition: "background 0.1s",
                                    }}
                                >
                                    {n.href ? (
                                        <Link href={n.href} style={{ textDecoration: "none" }}>
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{n.body}</p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{n.body}</p>
                                        </>
                                    )}
                                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}