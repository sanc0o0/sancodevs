"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PATHS } from "@/lib/path";
import { BUILDER_PROJECT_SUGGESTIONS, type ReadinessResult } from "@/lib/readiness";
import Link from "next/link";

interface Props {
    goalId: string;
    skills: string[];
    readiness: ReadinessResult;
    onBack: () => void;
}

export default function PathResult({ goalId, skills, readiness, onBack }: Props) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [selectedAction, setSelectedAction] = useState<"create" | "join" | "challenge" | null>(null);

    async function save(redirect: string) {
        setSaving(true);
        await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                skills,
                goal: goalId,
                pathId: goalId,
                readinessScore: readiness.score,
                userCategory: readiness.category,
            }),
        });
        router.push(redirect);
    }

    const path = PATHS[goalId];
    const suggestions = BUILDER_PROJECT_SUGGESTIONS[goalId] ?? BUILDER_PROJECT_SUGGESTIONS.webapp;

    // ── BUILDER (>70%) ──────────────────────────────────────────────────────
    if (readiness.category === "BUILDER") {
        return (
            <div className="space-y-6">
                {/* Score header */}
                <div>
                    <div className="w-7 h-0.5 bg-[var(--accent)] mb-4" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-green-500 bg-green-500/10">
                            <span className="text-green-500 font-semibold text-sm">{readiness.score}%</span>
                        </div>
                        <div>
                            <p className="text-xs text-green-500 uppercase tracking-wider font-medium mb-0.5">Builder ready</p>
                            <h1 className="text-xl font-medium text-[var(--text)]">You already know enough to build.</h1>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        You have {readiness.matchedSkills.length} of the core skills needed.
                        Stop consuming tutorials. Start shipping.
                    </p>
                </div>

                {/* Known skills */}
                <div className="flex flex-wrap gap-1.5">
                    {readiness.matchedSkills.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
                            ✓ {s}
                        </span>
                    ))}
                </div>

                {/* Three action paths */}
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">Choose your next move</p>
                    <div className="grid gap-2.5">
                        {[
                            {
                                key: "create" as const,
                                icon: "▣",
                                title: "Create a project",
                                desc: "Define your idea, stack, and scope. We'll help you structure it.",
                                action: () => save("/projects/new"),
                                cta: "Start building →",
                            },
                            {
                                key: "join" as const,
                                icon: "◈",
                                title: "Join a team project",
                                desc: "Browse open projects and contribute as a collaborator.",
                                action: () => save("/projects"),
                                cta: "Browse projects →",
                            },
                            {
                                key: "challenge" as const,
                                icon: "⊞",
                                title: "Pick a challenge",
                                desc: "Choose from curated real-world problems matched to your skills.",
                                action: null,
                                cta: "View challenges →",
                            },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setSelectedAction(opt.key)}
                                className={`text-left p-4 rounded-xl border transition-all cursor-pointer w-full
                                    ${selectedAction === opt.key
                                        ? "border-[var(--accent)] bg-[var(--surface2)]"
                                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg text-[var(--muted)]">{opt.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[var(--text)] mb-0.5">{opt.title}</p>
                                        <p className="text-xs text-[var(--muted)] leading-relaxed">{opt.desc}</p>
                                    </div>
                                    {selectedAction === opt.key && (
                                        <span className="text-[var(--accent)] text-sm">✓</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic project suggestions */}
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">
                        Suggested projects for your skill set
                    </p>
                    <div className="flex flex-col gap-2">
                        {suggestions.map((s, i) => (
                            <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium text-[var(--text)]">{s.title}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] whitespace-nowrap flex-shrink-0">
                                        {s.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">{s.description}</p>
                                <p className="text-[10px] text-[var(--muted)] font-mono">{s.techHint}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={onBack} className="text-sm text-[var(--muted)] bg-none border-none cursor-pointer hover:text-[var(--text)]">
                        ← Back
                    </button>
                    <button
                        onClick={() => {
                            if (selectedAction === "create") save("/projects/new");
                            else if (selectedAction === "join") save("/projects");
                            else save("/dashboard");
                        }}
                        disabled={saving}
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60 transition-opacity hover:opacity-85"
                    >
                        {saving ? "Starting..." : selectedAction ? `${selectedAction === "create" ? "Create project" : selectedAction === "join" ? "Browse projects" : "View challenges"} →` : "Start building →"}
                    </button>
                </div>
            </div>
        );
    }

    // ── INTERMEDIATE (30–70%) ───────────────────────────────────────────────
    if (readiness.category === "INTERMEDIATE") {
        const gapModules = path.modules.filter((_, i) => {
            const mod = path.modules[i];
            return readiness.missingSkills.some(ms =>
                mod.title.toLowerCase().includes(ms.toLowerCase()) ||
                mod.sub.toLowerCase().includes(ms.toLowerCase())
            );
        });
        const modulesToShow = gapModules.length > 0 ? gapModules : path.modules.slice(0, 3);

        return (
            <div className="space-y-6">
                <div>
                    <div className="w-7 h-0.5 bg-[var(--accent)] mb-4" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-500/10">
                            <span className="text-amber-500 font-semibold text-sm">{readiness.score}%</span>
                        </div>
                        <div>
                            <p className="text-xs text-amber-500 uppercase tracking-wider font-medium mb-0.5">Almost ready</p>
                            <h1 className="text-xl font-medium text-[var(--text)]">Close. Fill {readiness.missingSkills.length} gap{readiness.missingSkills.length !== 1 ? "s" : ""} and build.</h1>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        You know most of this already. A focused sprint will get you ready to ship.
                    </p>
                </div>

                {/* Skill breakdown */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-[var(--muted)]">Readiness</p>
                        <p className="text-xs font-medium text-[var(--text)]">{readiness.score}%</p>
                    </div>
                    <div className="h-1.5 bg-[var(--border)] rounded-full mb-4">
                        <div
                            className="h-1.5 bg-amber-500 rounded-full transition-all"
                            style={{ width: `${readiness.score}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">You know</p>
                            <div className="flex flex-wrap gap-1">
                                {readiness.matchedSkills.map(s => (
                                    <span key={s} className="text-[10px] px-2 py-0.5 rounded border border-green-500/20 bg-green-500/10 text-green-400">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">Gaps</p>
                            <div className="flex flex-wrap gap-1">
                                {readiness.missingSkills.map(s => (
                                    <span key={s} className="text-[10px] px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gap-fill path */}
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">
                        Gap-fill path — {modulesToShow.length} modules only
                    </p>
                    <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--text)]">{path.label}</span>
                            <span className="text-xs text-[var(--muted)] border border-[var(--border)] rounded-full px-2 py-0.5">
                                {modulesToShow.length} modules
                            </span>
                        </div>
                        {modulesToShow.map((mod, i) => (
                            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < modulesToShow.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                                <div className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--muted)] flex-shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[var(--text)]">{mod.title}</p>
                                    <p className="text-[10px] text-[var(--muted)] truncate">{mod.sub}</p>
                                </div>
                                <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{mod.duration}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <p className="text-xs text-amber-400 font-medium mb-1">After these modules →</p>
                    <p className="text-xs text-[var(--muted)]">
                        You&apos;ll have everything needed to join a real project or start building solo. This isn&apos;t a course — it&apos;s a sprint.
                    </p>
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={onBack} className="text-sm text-[var(--muted)] bg-none border-none cursor-pointer hover:text-[var(--text)]">
                        ← Back
                    </button>
                    <button
                        onClick={() => save("/dashboard")}
                        disabled={saving}
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60"
                    >
                        {saving ? "Starting..." : "Fill gaps & build →"}
                    </button>
                </div>
            </div>
        );
    }

    // ── BEGINNER (<30%) ──────────────────────────────────────────────────────
    const totalHrs = path.modules.reduce((a, m) => a + parseInt(m.duration), 0);

    return (
        <div className="space-y-6">
            <div>
                <div className="w-7 h-0.5 bg-[var(--accent)] mb-4" />
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[var(--border)] bg-[var(--surface2)]">
                        <span className="text-[var(--text)] font-semibold text-sm">{readiness.score}%</span>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-medium mb-0.5">Foundation needed</p>
                        <h1 className="text-xl font-medium text-[var(--text)]">Start here. Your path is ready.</h1>
                    </div>
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Everyone starts somewhere. This path is structured, short, and ends with a real project — not just theory.
                </p>
            </div>

            {/* What you'll build */}
            <div className="p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)]">
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">End goal</p>
                <p className="text-sm font-medium text-[var(--text)] mb-1">{path.label}</p>
                <p className="text-xs text-[var(--muted)]">By the end of this path, you&apos;ll have a real, deployable project.</p>
            </div>

            {/* Full path */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Your path</p>
                    <span className="text-xs text-[var(--muted)]">{path.modules.length} modules · ~{totalHrs} hrs</span>
                </div>
                <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
                    {path.modules.map((mod, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < path.modules.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                            <div className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--muted)] flex-shrink-0">
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--text)]">{mod.title}</p>
                                <p className="text-[10px] text-[var(--muted)] truncate">{mod.sub}</p>
                            </div>
                            <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{mod.duration}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm text-[var(--muted)] bg-none border-none cursor-pointer hover:text-[var(--text)]">
                    ← Back
                </button>
                <button
                    onClick={() => save("/dashboard")}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60"
                >
                    {saving ? "Starting..." : "Start learning →"}
                </button>
            </div>
        </div>
    );
}