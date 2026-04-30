"use client";
import { useState } from "react";

export default function TeamSection({ teams }: {
    teams: { id: string; role: string; user: { id: string; name: string | null; image: string | null } }[]
}) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1rem 1.375rem", background: "transparent", border: "none", cursor: "pointer",
                }}
            >
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Team ({teams.length})</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {open && (
                <div style={{ maxHeight: "240px", overflowY: "auto", borderTop: "0.5px solid var(--border)", padding: "0.75rem 1.375rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {teams.map(t => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <a href={`/user/${t.user.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--surface2)", border: "0.5px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                    {t.user.image
                                        ? <img src={t.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : <span style={{ fontSize: "11px", color: "var(--text)" }}>{t.user.name?.charAt(0)}</span>
                                    }
                                </div>
                            </a>
                            <div>
                                <p style={{ fontSize: "13px", color: "var(--text)" }}>{t.user.name}</p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}