"use client";

import { useState, useEffect } from "react";
import type { AchievementDefinition } from "./achievements.types";
import { THEME_CONFIG, RARITY_CONFIG, buildSharePayload } from "./achievements.utils";

interface AchievementShareModalProps {
    definition: AchievementDefinition;
    username: string;
    onClose: () => void;
}

export default function AchievementShareModal({
    definition,
    username,
    onClose,
}: AchievementShareModalProps) {
    const [copied, setCopied] = useState(false);
    const theme = THEME_CONFIG[definition.theme];
    const rarity = RARITY_CONFIG[definition.rarity];

    const profileUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/user/${username}`
            : `https://sancodevs.com/user/${username}`;

    const { text, url, twitterUrl, linkedInUrl } = buildSharePayload(
        definition,
        username,
        profileUrl
    );

    // Scroll lock + Esc
    useEffect(() => {
        document.body.style.overflow = "hidden";
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(`${text}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback — select textarea
        }
    }

    async function handleNativeShare() {
        if (!navigator.share) return;
        try {
            await navigator.share({
                title: `${definition.title} — Sancodevs`,
                text,
                url,
            });
        } catch {
            // user cancelled
        }
    }

    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
        >
            <style>{`
        @keyframes shareModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

            <div
                style={{
                    width: "100%",
                    maxWidth: 440,
                    background: "var(--surface)",
                    border: `0.5px solid ${rarity.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 0.5px ${rarity.border}, 0 8px 32px ${theme.glow}`,
                    animation: "shareModalIn 0.18s ease",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "15px 18px",
                        borderBottom: "0.5px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: theme.bg,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: theme.glow,
                                border: `0.5px solid ${rarity.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                color: theme.color,
                            }}
                        >
                            {definition.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                                {definition.title}
                            </p>
                            <p style={{ fontSize: 10, color: theme.color, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {rarity.label}
                            </p>
                        </div>
                    </div>
                    <button
                        title="Close"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Share preview text */}
                <div style={{ padding: "16px 18px" }}>
                    <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                        Share message
                    </p>
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface2)",
                            fontSize: 12,
                            color: "var(--muted)",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {text}
                    </div>
                </div>

                {/* Share buttons */}
                <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Twitter/X */}
                    <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            borderRadius: 9,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface2)",
                            color: "var(--text)",
                            textDecoration: "none",
                            fontSize: 13,
                            fontWeight: 500,
                            transition: "border-color 0.12s, background 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1d9bf0"; e.currentTarget.style.background = "rgba(29,155,240,0.07)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Share on X / Twitter
                    </a>

                    {/* LinkedIn */}
                    <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            borderRadius: 9,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface2)",
                            color: "var(--text)",
                            textDecoration: "none",
                            fontSize: 13,
                            fontWeight: 500,
                            transition: "border-color 0.12s, background 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0a66c2"; e.currentTarget.style.background = "rgba(10,102,194,0.07)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Share on LinkedIn
                    </a>

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            borderRadius: 9,
                            border: `0.5px solid ${copied ? "#22c55e" : "var(--border)"}`,
                            background: copied ? "rgba(34,197,94,0.07)" : "var(--surface2)",
                            color: copied ? "#22c55e" : "var(--text)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.12s",
                            textAlign: "left",
                        }}
                    >
                        {copied ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                                Copy message
                            </>
                        )}
                    </button>

                    {/* Native share (mobile) */}
                    {canNativeShare && (
                        <button
                            onClick={handleNativeShare}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderRadius: 9,
                                border: "0.5px solid var(--border)",
                                background: "var(--surface2)",
                                color: "var(--text)",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            More options
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}