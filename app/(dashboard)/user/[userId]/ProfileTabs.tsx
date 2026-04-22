"use client";

import { useState } from "react";
import Link from "next/link";

interface Project {
    id: string;
    title: string;
    status: string;
    techStack: string[];
}

interface Group {
    id: string;
    name: string;
    isPrivate: boolean;
}

interface Props {
    skills: string[];
    projects: Project[];
    publicGroups: Group[];
    isOwnProfile: boolean;
    userId: string;
}

export default function ProfileTabs({ skills, projects, publicGroups, isOwnProfile, userId }: Props) {
    const [tab, setTab] = useState<"projects" | "about" | "groups">("projects");

    const statusColor: Record<string, string> = {
        OPEN: "text-green-400 bg-green-400/10",
        IN_PROGRESS: "text-blue-400 bg-blue-400/10",
        COMPLETED: "text-purple-400 bg-purple-400/10",
        CLOSED: "text-[var(--muted)] bg-[var(--surface2)]",
    };

    return (
        <div>
            {/* Tab bar */}
            <div className="flex gap-0.5 bg-[var(--surface2)] p-0.5 rounded-xl mb-4">
                {(["projects", "about", "groups"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer capitalize
                            ${tab === t
                                ? "bg-[var(--bg)] text-[var(--text)] shadow-sm"
                                : "bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Projects tab */}
            {tab === "projects" && (
                <div className="flex flex-col gap-2">
                    {projects.length === 0 ? (
                        <div className="text-center py-10 text-sm text-[var(--muted)]">No projects yet</div>
                    ) : (
                        projects.map(p => (
                            <Link
                                key={p.id}
                                href={`/projects/${p.id}`}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors no-underline"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text)] truncate mb-1">{p.title}</p>
                                    {p.techStack.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {p.techStack.slice(0, 3).map(t => (
                                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)]">
                                                    {t}
                                                </span>
                                            ))}
                                            {p.techStack.length > 3 && (
                                                <span className="text-[9px] text-[var(--muted)]">+{p.techStack.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-3 font-medium ${statusColor[p.status] ?? "text-[var(--muted)] bg-[var(--surface2)]"}`}>
                                    {p.status}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* About tab */}
            {tab === "about" && (
                <div className="flex flex-col gap-3">
                    {skills.length > 0 ? (
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-3">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(s => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)]">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-sm text-[var(--muted)]">No skills listed</div>
                    )}
                </div>
            )}

            {/* Groups tab */}
            {tab === "groups" && (
                <div className="flex flex-col gap-2">
                    {publicGroups.length === 0 ? (
                        <div className="text-center py-10 text-sm text-[var(--muted)]">No public groups</div>
                    ) : (
                        publicGroups.map(g => (
                            <div key={g.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text)] flex-shrink-0">
                                    {g.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-sm text-[var(--text)] font-medium truncate">{g.name}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}