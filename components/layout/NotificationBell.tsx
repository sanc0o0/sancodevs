"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
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
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unseenProjects, setUnseenProjects] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 769);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        Promise.all([
            fetch("/api/notifications").then(r => r.json()),
            fetch("/api/projects/seen").then(r => r.json()),
        ]).then(([notifs, proj]) => {
            if (Array.isArray(notifs)) setNotifications(notifs);
            setUnseenProjects(proj.unseen ?? 0);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!session?.user?.id) return;
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`user-${session.user.id}`);
        channel.bind("notification:new", (notif: Notification) => {
            setNotifications(prev => [notif, ...prev]);
        });
        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`user-${session.user.id}`);
        };
    }, [session?.user?.id]);

    useEffect(() => {
        if (pathname === "/projects") {
            fetch("/api/projects/seen", { method: "POST" })
                .then(() => setUnseenProjects(0))
                .catch(() => { });
        }
    }, [pathname]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function markRead(id: string) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
    }

    async function markAllRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => { });
    }

    const unread = notifications.filter(n => !n.read).length;
    const total = unread + unseenProjects;

    function handleBellClick() {
        if (isMobile) {
            router.push("/notifications");
        } else {
            setOpen(o => !o);
        }
    }

    return (
        <div ref={ref} className="relative" style={{ position: "relative" }}>
            <button
                onClick={handleBellClick}
                aria-label="Notifications"
                className="w-[34px] h-[34px] rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] cursor-pointer flex items-center justify-center relative hover:bg-[var(--surface2)] transition-colors"
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
                {total > 0 && (
                    <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        minWidth: "16px", height: "16px", borderRadius: "999px",
                        padding: "0 3px", background: "#ef4444",
                        border: "2px solid var(--bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 600, color: "white", lineHeight: 1,
                    }}>
                        {total > 9 ? "9+" : total}
                    </span>
                )}
            </button>

            {/* Desktop dropdown only */}
            {open && !isMobile && (
                <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    width: "320px", borderRadius: "12px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                    zIndex: 50, overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    animation: "fadeIn 0.12s ease",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderBottom: "0.5px solid var(--border)",
                    }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Notifications</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {unread > 0 && <span style={{ fontSize: "10px", color: "var(--muted)" }}>{unread} unread</span>}
                            {unread > 0 && (
                                <button onClick={markAllRead} style={{
                                    fontSize: "10px", color: "var(--muted)", background: "none",
                                    border: "none", cursor: "pointer", textDecoration: "underline",
                                }}>Mark all read</button>
                            )}
                        </div>
                    </div>

                    {unseenProjects > 0 && (
                        <Link href="/projects" onClick={() => setOpen(false)} style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "12px 14px", borderBottom: "0.5px solid var(--border)",
                            background: "var(--surface2)", textDecoration: "none",
                        }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                    {unseenProjects} new project{unseenProjects > 1 ? "s" : ""} listed
                                </p>
                                <p style={{ fontSize: "10px", color: "var(--muted)" }}>Browse projects →</p>
                            </div>
                        </Link>
                    )}

                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                        {notifications.length === 0 && unseenProjects === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", color: "var(--muted)" }}>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    style={{
                                        padding: "12px 14px",
                                        borderBottom: "0.5px solid var(--border)",
                                        cursor: "pointer",
                                        background: n.read ? "transparent" : "var(--surface2)",
                                        transition: "background 0.15s",
                                    }}
                                >
                                    {n.href ? (
                                        <Link href={n.href} onClick={() => setOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                                            <p style={{ fontSize: "12px", fontWeight: n.read ? 400 : 500, color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                                            <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.5 }}>{n.body}</p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: "12px", fontWeight: n.read ? 400 : 500, color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                                            <p style={{ fontSize: "10px", color: "var(--muted)" }}>{n.body}</p>
                                        </>
                                    )}
                                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                                        {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}