"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: "/learn",
        label: "Learn",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    {
        href: "/projects",
        label: "Projects",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        href: "/community",
        label: "Community",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        href: "/profile",
        label: "Profile",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [pathLabel, setPathLabel] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/onboarding/me")
            .then(r => r.json())
            .then(d => setPathLabel(d.label ?? null))
            .catch(() => { });
    }, []);

    return (
        <aside style={{
            width: "200px",
            flexShrink: 0,
            borderRight: "0.5px solid var(--border)",
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            height: "calc(100vh - 54px)",
        }} className="hidden-mobile"> 
        
            {/* Nav links */}
            <nav style={{ padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                {links.map(link => {
                    const active = pathname === link.href ||
                        (link.href !== "/dashboard" && pathname.startsWith(link.href));
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: "flex", alignItems: "center", gap: "9px",
                            padding: "8px 10px", borderRadius: "7px",
                            fontSize: "13px", textDecoration: "none",
                            color: active ? "var(--text)" : "var(--muted)",
                            background: active ? "var(--surface2)" : "transparent",
                            transition: "all 0.15s",
                        }}>
                            <span style={{ color: active ? "var(--text)" : "var(--muted)" }}>
                                {link.icon}
                            </span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Sticky bottom — current path card */}
            <div style={{ padding: "1rem" }}>
                <div style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "0.5px solid var(--border)",
                    background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Current path
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500, lineHeight: 1.4 }}>
                        {pathLabel ?? "—"}
                    </p>
                </div>
            </div>
        </aside>
    );
}