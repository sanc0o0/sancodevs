"use client";

import { useState } from "react";
import type { AchievementDefinition, UserAchievement } from "./achievements.types";
import { THEME_CONFIG, RARITY_CONFIG } from "./achievements.utils";

interface AchievementCardProps {
    definition: AchievementDefinition;
    earned: UserAchievement | null;
    onShare: (definition: AchievementDefinition) => void;
}

export default function AchievementCard({ definition, earned, onShare }: AchievementCardProps) {
    const [showInfo, setShowInfo] = useState(false);
    const theme = THEME_CONFIG[definition.theme];
    const rarity = RARITY_CONFIG[definition.rarity];
    const isEarned = earned !== null;

    return (
        <>
            <style>{`
        @keyframes cardShine {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        .ach-card {
          position: relative;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          cursor: default;
        }
        .ach-card.earned:hover {
          transform: translateY(-1px);
        }
        .ach-card.earned:hover .ach-shine {
          animation: cardShine 0.65s ease forwards;
        }
        .ach-info-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11px;
          color: var(--muted);
          line-height: 1.5;
          z-index: 20;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          pointer-events: none;
        }
      `}</style>

            <div
                className={`ach-card ${isEarned ? "earned" : "locked"}`}
                style={{
                    background: isEarned ? theme.bg : "var(--surface)",
                    border: `0.5px solid ${isEarned ? rarity.border : "var(--border)"}`,
                    boxShadow: isEarned ? `0 0 0 0.5px ${rarity.border}, 0 4px 20px ${theme.glow}` : "none",
                    opacity: isEarned ? 1 : 0.45,
                    filter: isEarned ? "none" : "grayscale(0.6)",
                }}
            >
                {/* Shine overlay — only on earned */}
                {isEarned && (
                    <div
                        className="ach-shine"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "40%",
                            height: "100%",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                            pointerEvents: "none",
                            transform: "translateX(-100%) skewX(-15deg)",
                        }}
                    />
                )}

                {/* Info tooltip */}
                {showInfo && (
                    <div className="ach-info-tooltip">
                        <p style={{ fontWeight: 500, color: "var(--text)", marginBottom: 4, fontSize: 11 }}>How to earn</p>
                        {definition.howToEarn}
                    </div>
                )}

                {/* Header row: icon + rarity + info button */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    {/* Icon */}
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: isEarned ? `${theme.glow}` : "var(--surface2)",
                            border: `0.5px solid ${isEarned ? rarity.border : "var(--border)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            color: isEarned ? theme.color : "var(--muted)",
                            flexShrink: 0,
                        }}
                    >
                        {definition.icon}
                    </div>

                    {/* Right actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {/* Rarity badge */}
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 600,
                                padding: "2px 7px",
                                borderRadius: 20,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: isEarned ? rarity.color : "var(--muted)",
                                background: isEarned ? `${rarity.border}` : "var(--surface2)",
                                border: `0.5px solid ${isEarned ? rarity.border : "var(--border)"}`,
                            }}
                        >
                            {rarity.label}
                        </span>

                        {/* Info button */}
                        <button
                            onMouseEnter={() => setShowInfo(true)}
                            onMouseLeave={() => setShowInfo(false)}
                            onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "0.5px solid var(--border)",
                                background: "var(--surface2)",
                                color: "var(--muted)",
                                fontSize: 10,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                position: "relative",
                                zIndex: 21,
                            }}
                            aria-label="How to earn"
                        >
                            i
                        </button>
                    </div>
                </div>

                {/* Title + description */}
                <div style={{ flex: 1 }}>
                    <p
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isEarned ? "var(--text)" : "var(--muted)",
                            margin: "0 0 3px",
                            lineHeight: 1.3,
                        }}
                    >
                        {definition.title}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                        {definition.description}
                    </p>
                </div>

                {/* Footer: earned date + share OR locked */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                    {isEarned ? (
                        <>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: "var(--muted)",
                                }}
                            >
                                {new Date(earned!.earnedAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                            <button
                                onClick={() => onShare(definition)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    border: `0.5px solid ${rarity.border}`,
                                    background: "transparent",
                                    color: theme.color,
                                    fontSize: 10,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "background 0.12s",
                                    fontWeight: 500,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = theme.bg)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                                </svg>
                                Share
                            </button>
                        </>
                    ) : (
                        <span
                            style={{
                                fontSize: 10,
                                color: "var(--muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            Locked
                        </span>
                    )}
                </div>

                {/* Theme label strip at bottom */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: isEarned
                            ? `linear-gradient(90deg, ${theme.color}60, ${theme.color}20)`
                            : "var(--border)",
                        borderRadius: "0 0 12px 12px",
                    }}
                />
            </div>
        </>
    );
}