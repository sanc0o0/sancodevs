"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
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
    const [unseenProjects, setUnseenProjects] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        fetch("/api/notifications")
            .then(r => r.json())
            .then(d => Array.isArray(d) && setNotifications(d))
            .catch(() => { });

        fetch("/api/projects/seen")
            .then(r => r.json())
            .then(d => setUnseenProjects(d.unseen ?? 0))
            .catch(() => { });
    }, []);

    // Mark projects as seen when user visits /projects
    useEffect(() => {
        if (pathname === "/projects") {
            fetch("/api/projects/seen", { method: "POST" })
                .then(() => setUnseenProjects(0))
                .catch(() => { });
        }
    }, [pathname]);

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

    const unreadNotifications = notifications.filter(n => !n.read).length;
    const totalBadge = unreadNotifications + unseenProjects;

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Notifications"
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
                {totalBadge > 0 && (
                    <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        minWidth: "16px", height: "16px",
                        borderRadius: "20px", padding: "0 4px",
                        background: "#e24b4a", border: "1.5px solid var(--bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 600, color: "#fff",
                        lineHeight: 1,
                    }}>
                        {totalBadge > 9 ? "9+" : totalBadge}
                    </span>
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
                    <div style={{
                        padding: "10px 14px", borderBottom: "0.5px solid var(--border)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                            Notifications
                        </p>
                        {totalBadge > 0 && (
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                {totalBadge} unread
                            </span>
                        )}
                    </div>

                    {/* New projects banner */}
                    {unseenProjects > 0 && (
                        <Link href="/projects" onClick={() => setOpen(false)} style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "10px 14px",
                            borderBottom: "0.5px solid var(--border)",
                            background: "var(--surface2)", textDecoration: "none",
                            transition: "background 0.1s",
                        }}>
                            <div style={{
                                width: "8px", height: "8px", borderRadius: "50%",
                                background: "#e24b4a", flexShrink: 0,
                            }} />
                            <div>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                    {unseenProjects} new project{unseenProjects > 1 ? "s" : ""} listed
                                </p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                                    Tap to browse →
                                </p>
                            </div>
                        </Link>
                    )}

                    {/* Regular notifications */}
                    {notifications.length === 0 && unseenProjects === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: "340px", overflowY: "auto" }}>
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
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                                {n.title}
                                            </p>
                                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                                                {n.body}
                                            </p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                                {n.title}
                                            </p>
                                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                                                {n.body}
                                            </p>
                                        </>
                                    )}
                                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                                        {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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