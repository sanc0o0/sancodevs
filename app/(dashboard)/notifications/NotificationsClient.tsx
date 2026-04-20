"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    body: string;
    href: string | null;
    read: boolean;
    createdAt: Date;
};

interface Props {
    grouped: Record<string, Notification[]>;
}

export default function NotificationsClient({ grouped }: Props) {
    const router = useRouter();
    const hasAny = Object.keys(grouped).length > 0;

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0" }}>
            {/* Header with back button */}
            <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "1rem 1.25rem",
                borderBottom: "0.5px solid var(--border)",
                position: "sticky", top: 0,
                background: "var(--bg)", zIndex: 10,
            }}>
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    style={{
                        width: "34px", height: "34px", borderRadius: "8px",
                        border: "0.5px solid var(--border)", background: "transparent",
                        color: "var(--text)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h1 style={{ fontSize: "16px", fontWeight: 500, color: "var(--text)" }}>Notifications</h1>
            </div>

            {/* Content */}
            {!hasAny ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
                    <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "1rem",
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500, marginBottom: "6px" }}>All caught up</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)" }}>No notifications yet</p>
                </div>
            ) : (
                <div>
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            {/* Date header */}
                            <div style={{
                                padding: "10px 1.25rem 6px",
                                position: "sticky", top: "57px",
                                background: "var(--bg)", zIndex: 5,
                            }}>
                                <p style={{
                                    fontSize: "11px", fontWeight: 600,
                                    color: "var(--muted)",
                                    textTransform: "uppercase", letterSpacing: "0.07em",
                                }}>{date}</p>
                            </div>

                            {/* Notifications in this group */}
                            {items.map((n, i) => (
                                <NotifRow key={n.id} n={n} isLast={i === items.length - 1} />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NotifRow({ n, isLast }: { n: Notification; isLast: boolean }) {
    const time = new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const inner = (
        <div style={{
            display: "flex", gap: "12px", alignItems: "flex-start",
            padding: "14px 1.25rem",
            borderBottom: isLast ? "none" : "0.5px solid var(--border)",
            background: n.read ? "transparent" : "var(--surface2)",
            transition: "background 0.15s",
        }}>
            {/* Unread dot */}
            <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                marginTop: "5px", flexShrink: 0,
                background: n.read ? "transparent" : "#ef4444",
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: "13px", fontWeight: n.read ? 400 : 500,
                    color: "var(--text)", marginBottom: "3px",
                    lineHeight: 1.4,
                }}>{n.title}</p>
                <p style={{
                    fontSize: "12px", color: "var(--muted)",
                    lineHeight: 1.5, marginBottom: "6px",
                }}>{n.body}</p>
                <p style={{ fontSize: "10px", color: "var(--muted)" }}>{time}</p>
            </div>

            {/* Arrow if has link */}
            {n.href && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "4px" }}>
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            )}
        </div>
    );

    if (n.href) {
        return (
            <Link href={n.href} style={{ textDecoration: "none", display: "block" }}>
                {inner}
            </Link>
        );
    }

    return inner;
}