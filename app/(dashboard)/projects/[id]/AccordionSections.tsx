"use client";

import { useState } from "react";
import ApplicantActions from "./ApplicantActions";

/* ─── Types ─────────────────────────────────────────────── */
type User = { id: string; name: string | null; image: string | null };
type TeamMember = { id: string; userId: string; role: string; user: User };
type Applicant = {
    id: string; userId: string; message: string | null; status: string; createdAt: Date;
    user: { id: string; name: string | null; email: string; image: string | null };
};

interface Props {
    teams: TeamMember[];
    isOwner: boolean;
    initialApplicants: Applicant[];
    projectId: string;
    projectTitle: string;
}

/* ─── Accordion ──────────────────────────────────────────── */
export default function AccordionSections({ teams, isOwner, initialApplicants, projectId, projectTitle }: Props) {
    // null = all closed, "team" | "requests" = which is open
    const [open, setOpen] = useState<"team" | "requests" | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);

    function toggle(section: "team" | "requests") {
        setOpen(prev => prev === section ? null : section);
    }

    function removeApplicant(applicationId: string) {
        setApplicants(prev => prev.filter(a => a.id !== applicationId));
    }

    const showTeam = teams.length > 0;
    const showRequests = isOwner;

    if (!showTeam && !showRequests) return null;

    return (
        <div className="flex flex-col gap-3">

            {/* ── Team section ── */}
            {showTeam && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <button
                        onClick={() => toggle("team")}
                        className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                        style={{ borderBottom: open === "team" ? "0.5px solid var(--border)" : "none" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text)]">Team</span>
                            <span className="text-[10px] font-semibold bg-[var(--surface2)] text-[var(--muted)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                                {teams.length}
                            </span>
                        </div>
                        <Chevron open={open === "team"} />
                    </button>

                    {open === "team" && (
                        <div className="flex flex-col divide-y divide-[var(--border)]">
                            {teams.map(t => (
                                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-9 h-9 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {t.user.image
                                            ? <img src={t.user.image} alt="" className="w-full h-full object-cover" />
                                            : <span className="text-xs text-[var(--text)]">{t.user.name?.charAt(0)}</span>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--text)] truncate">{t.user.name}</p>
                                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{t.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Join requests section (owner only) ── */}
            {showRequests && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <button
                        onClick={() => toggle("requests")}
                        className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                        style={{ borderBottom: open === "requests" ? "0.5px solid var(--border)" : "none" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text)]">Join requests</span>
                            <span className="text-[10px] font-semibold bg-[var(--surface2)] text-[var(--muted)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                                {applicants.length}
                            </span>
                        </div>
                        <Chevron open={open === "requests"} />
                    </button>

                    {open === "requests" && (
                        <div style={{ maxHeight: "min(340px, 45vh)", overflowY: "auto" }}>
                            {applicants.length === 0 ? (
                                <div className="px-5 py-6 text-center">
                                    <p className="text-xs text-[var(--muted)]">No pending requests</p>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-[var(--border)]">
                                    {applicants.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {a.user.image
                                                    ? <img src={a.user.image} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-xs text-[var(--text)]">{a.user.name?.charAt(0)}</span>
                                                }
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[var(--text)] truncate">{a.user.name}</p>
                                                <p className="text-[10px] text-[var(--muted)] truncate">{a.user.email}</p>
                                                {a.message && (
                                                    <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                                                        &quot;{a.message}&quot;
                                                    </p>
                                                )}
                                            </div>
                                            {/* Actions — removes row after respond */}
                                            <ApplicantActions
                                                applicationId={a.id}
                                                userId={a.userId}
                                                projectId={projectId}
                                                currentStatus={a.status}
                                                userName={a.user.name ?? "Someone"}
                                                userEmail={a.user.email}
                                                projectTitle={projectTitle}
                                                onResponded={() => removeApplicant(a.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Chevron icon ───────────────────────────────────────── */
function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="2"
            style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                flexShrink: 0,
            }}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}