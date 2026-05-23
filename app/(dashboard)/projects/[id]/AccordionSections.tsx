"use client";

// app/(dashboard)/projects/[id]/AccordionSections.tsx

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ApplicantActions from "./ApplicantActions";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserBasic = { id: string; name: string | null; username?: string | null; image: string | null };
type TeamMember = { id: string; userId: string; role: string; permissionLevel?: string; user: UserBasic };
type Applicant = {
    id: string; userId: string; message: string | null; pitch?: string | null;
    desiredRole?: string | null; status: string; createdAt: Date;
    user: { id: string; name: string | null; username?: string | null; email: string; image: string | null };
};

interface Props {
    teams: TeamMember[];
    isOwner: boolean;
    initialApplicants: Applicant[];
    projectId: string;
    projectTitle: string;
}

// Profile URL — /user/username, NO @ (@ breaks Next.js routing)
function profileHref(username?: string | null, fallbackId?: string): string {
    if (username) return `/user/${username}`;
    if (fallbackId) return `/user/${fallbackId}`;
    return "#";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AccordionSections({ teams, isOwner, initialApplicants, projectId, projectTitle }: Props) {
    const [open, setOpen] = useState<"team" | "requests" | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);

    const toggle = (s: "team" | "requests") => setOpen(prev => prev === s ? null : s);
    const removeApplicant = (id: string) => setApplicants(prev => prev.filter(a => a.id !== id));
    const pendingCount = applicants.filter(a => a.status === "PENDING").length;

    if (!teams.length && !isOwner) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* ── Team ── */}
            {teams.length > 0 && (
                <div style={{ borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
                    <AccordionHeader onClick={() => toggle("team")} isOpen={open === "team"} borderBottom={open === "team"}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Team</span>
                        <CountBadge n={teams.length} />
                        {open !== "team" && (
                            <div style={{ display: "flex", alignItems: "center" }}>
                                {teams.slice(0, 3).map((t, i) => (
                                    <div key={t.id} style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--surface)", marginLeft: i > 0 ? -7 : 0, background: "var(--surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 3 - i, flexShrink: 0 }}>
                                        {t.user.image
                                            ? <Image src={t.user.image} alt="" width={22} height={22} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                            : <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text)" }}>{(t.user.name ?? t.user.username ?? "?").charAt(0).toUpperCase()}</span>
                                        }
                                    </div>
                                ))}
                                {teams.length > 3 && (
                                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--surface)", marginLeft: -7, background: "var(--surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 0, flexShrink: 0 }}>
                                        <span style={{ fontSize: 7, fontWeight: 700, color: "var(--muted)" }}>+{teams.length - 3}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </AccordionHeader>

                    {open === "team" && (
                        <div style={{ maxHeight: "min(320px, 45vh)", overflowY: "auto" }}>
                            {teams.map((t, i) => (
                                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < teams.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                    <Link href={profileHref(t.user.username, t.userId)}>
                                        <Avatar image={t.user.image} name={t.user.name ?? t.user.username} size={36} />
                                    </Link>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link href={profileHref(t.user.username, t.userId)} style={{ textDecoration: "none" }}>
                                            <p style={{ fontSize: 13, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", transition: "color 0.12s" }}
                                                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text)")}
                                            >{t.user.name ?? t.user.username}</p>
                                        </Link>
                                        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, textTransform: "capitalize", letterSpacing: "0.04em" }}>
                                            {t.role}{t.user.username ? ` · @${t.user.username}` : ""}
                                        </p>
                                    </div>
                                    {t.permissionLevel === "OWNER" && (
                                        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0, background: "rgba(55,138,221,0.1)", color: "#378ADD", border: "0.5px solid rgba(55,138,221,0.25)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Join requests ── */}
            {isOwner && (
                <div style={{ borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
                    <AccordionHeader onClick={() => toggle("requests")} isOpen={open === "requests"} borderBottom={open === "requests"}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Join requests</span>
                        <CountBadge n={applicants.length} />
                        {pendingCount > 0 && (
                            <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 10, fontWeight: 600, background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "0.5px solid rgba(251,146,60,0.3)" }}>
                                {pendingCount} pending
                            </span>
                        )}
                    </AccordionHeader>

                    {open === "requests" && (
                        <div style={{ maxHeight: "min(420px, 55vh)", overflowY: "auto" }}>
                            {applicants.length === 0 ? (
                                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>No pending requests</p>
                                </div>
                            ) : applicants.map((a, i) => (
                                <div key={a.id} style={{ padding: "12px 16px", borderBottom: i < applicants.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                        <Link href={profileHref(a.user.username, a.userId)}>
                                            <Avatar image={a.user.image} name={a.user.name ?? a.user.username} size={36} />
                                        </Link>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Link href={profileHref(a.user.username, a.userId)} style={{ textDecoration: "none" }}>
                                                <p style={{ fontSize: 13, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", transition: "color 0.12s" }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text)")}
                                                >{a.user.name ?? a.user.username}</p>
                                            </Link>
                                            <p style={{ fontSize: 10, color: "var(--muted)", margin: "2px 0 0" }}>
                                                {a.user.email}{a.user.username ? ` · @${a.user.username}` : ""}
                                            </p>
                                            {a.desiredRole && (
                                                <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "0.5px solid rgba(55,138,221,0.25)", color: "#93c5fd", background: "rgba(55,138,221,0.06)" }}>
                                                    {a.desiredRole}
                                                </span>
                                            )}
                                        </div>
                                        <ApplicantActions
                                            applicationId={a.id} userId={a.userId} projectId={projectId}
                                            currentStatus={a.status}
                                            userName={a.user.name ?? a.user.username ?? "Someone"}
                                            userEmail={a.user.email} projectTitle={projectTitle}
                                            onResponded={() => removeApplicant(a.id)}
                                        />
                                    </div>
                                    {a.pitch && (
                                        <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 7, background: "var(--surface2)", border: "0.5px solid var(--border)" }}>
                                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>Pitch</p>
                                            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
                                                &ldquo;{a.pitch.slice(0, 220)}{a.pitch.length > 220 ? "…" : ""}&rdquo;
                                            </p>
                                        </div>
                                    )}
                                    {!a.pitch && a.message && (
                                        <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                                            &ldquo;{a.message}&rdquo;
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Avatar({ image, name, size }: { image: string | null; name: string | null | undefined; size: number }) {
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--border)", background: "var(--surface2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color 0.15s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
        >
            {image
                ? <Image src={image} alt={name ?? ""} width={size} height={size} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                : <span style={{ fontSize: size * 0.36, fontWeight: 700, color: "var(--text)" }}>{(name ?? "?").charAt(0).toUpperCase()}</span>
            }
        </div>
    );
}

function AccordionHeader({ onClick, isOpen, borderBottom, children }: { onClick: () => void; isOpen: boolean; borderBottom: boolean; children: React.ReactNode }) {
    return (
        <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "transparent", border: "none", borderBottom: borderBottom ? "0.5px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>{children}</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>
    );
}

function CountBadge({ n }: { n: number }) {
    return (
        <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "var(--surface2)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>{n}</span>
    );
}