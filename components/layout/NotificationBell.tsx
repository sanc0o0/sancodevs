"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
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
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unseenProjects, setUnseenProjects] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Initial fetch
        Promise.all([
            fetch("/api/notifications").then(r => r.json()),
            fetch("/api/projects/seen").then(r => r.json()),
        ]).then(([notifs, proj]) => {
            if (Array.isArray(notifs)) setNotifications(notifs);
            setUnseenProjects(proj.unseen ?? 0);
        }).catch(() => { });
    }, []);

    // Pusher: real-time notifications
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

    // Auto-mark projects seen
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

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Notifications"
                className="w-[34px] h-[34px] rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] cursor-pointer flex items-center justify-center relative hover:bg-[var(--surface2)] transition-colors"
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full px-1 bg-red-500 border-2 border-[var(--bg)] flex items-center justify-center text-[9px] font-semibold text-white leading-none">
                        {total > 9 ? "9+" : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] rounded-xl border border-[var(--border)] bg-[var(--surface)] z-50 overflow-hidden shadow-2xl" style={{ animation: "fadeIn 0.12s ease" }}>
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border)]">
                        <p className="text-sm font-medium text-[var(--text)]">Notifications</p>
                        <div className="flex items-center gap-2">
                            {unread > 0 && <span className="text-[10px] text-[var(--muted)]">{unread} unread</span>}
                            {unread > 0 && (
                                <button onClick={markAllRead} className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer underline">
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {unseenProjects > 0 && (
                        <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)] bg-[var(--surface2)] no-underline hover:bg-[var(--surface2)] transition-colors">
                            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-[var(--text)] mb-0.5">{unseenProjects} new project{unseenProjects > 1 ? "s" : ""} listed</p>
                                <p className="text-[10px] text-[var(--muted)]">Browse projects →</p>
                            </div>
                        </Link>
                    )}

                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 && unseenProjects === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-[var(--muted)]">No notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className={`px-3.5 py-2.5 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--surface2)]
                                        ${n.read ? "bg-transparent" : "bg-[var(--accent)]/5"}`}
                                >
                                    {n.href ? (
                                        <Link href={n.href} onClick={() => setOpen(false)} className="no-underline block">
                                            <p className={`text-xs mb-0.5 ${n.read ? "text-[var(--text)]" : "text-[var(--text)] font-medium"}`}>{n.title}</p>
                                            <p className="text-[10px] text-[var(--muted)] leading-relaxed">{n.body}</p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p className={`text-xs mb-0.5 ${n.read ? "text-[var(--text)]" : "text-[var(--text)] font-medium"}`}>{n.title}</p>
                                            <p className="text-[10px] text-[var(--muted)]">{n.body}</p>
                                        </>
                                    )}
                                    <p className="text-[10px] text-[var(--muted)] mt-1">
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