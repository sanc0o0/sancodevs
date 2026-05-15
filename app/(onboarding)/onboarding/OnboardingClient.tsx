"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── DATA ────────────────────────────────────────────────────────────────────

const DOMAINS = [
    { id: "web_dev", label: "Web Development", icon: "/icons8-web-development-64.png" },
    { id: "app_dev", label: "App Development", icon: "/icons8-app-development-100.png" },
    { id: "ai_ml", label: "AI / ML", icon: "/icons8-robot-100.png" },
    { id: "game_dev", label: "Game Development", icon: "/icons8-game-controller-64.png" },
    { id: "cybersecurity", label: "Cybersecurity", icon: "/icons8-cyber-security-50.png" },
    { id: "ui_ux", label: "UI / UX", icon: "/icons8-color-palette-100.png" },
    { id: "devops", label: "DevOps", icon: "/icons8-devops-50.png" },
    { id: "backend", label: "Backend Systems", icon: "/icons8-backend-development-48.png" },
    { id: "open_source", label: "Open Source", icon: "/icons8-globe-48.png" },
    { id: "startup", label: "Startup Building", icon: "/icons8-startup-100.png" },
];

const ROLES_BY_DOMAIN: Record<string, { id: string; label: string }[]> = {
    web_dev: [
        { id: "frontend_dev", label: "Frontend Developer" },
        { id: "backend_dev", label: "Backend Developer" },
        { id: "fullstack_dev", label: "Full Stack Developer" },
        { id: "ui_engineer", label: "UI Engineer" },
        { id: "api_engineer", label: "API Engineer" },
        { id: "devops", label: "DevOps" },
        { id: "qa", label: "QA Engineer" },
    ],
    app_dev: [
        { id: "ios_dev", label: "iOS Developer" },
        { id: "android_dev", label: "Android Developer" },
        { id: "rn_dev", label: "React Native Developer" },
        { id: "flutter_dev", label: "Flutter Developer" },
        { id: "qa", label: "QA Engineer" },
    ],
    ai_ml: [
        { id: "ml_engineer", label: "ML Engineer" },
        { id: "data_engineer", label: "Data Engineer" },
        { id: "ai_research", label: "AI Research" },
        { id: "cv_engineer", label: "Computer Vision" },
        { id: "nlp_engineer", label: "NLP Engineer" },
        { id: "mlops", label: "MLOps" },
    ],
    game_dev: [
        { id: "gameplay_dev", label: "Gameplay Developer" },
        { id: "graphics_dev", label: "Graphics / Shader Dev" },
        { id: "game_designer", label: "Game Designer" },
        { id: "sound_designer", label: "Sound Designer" },
        { id: "qa", label: "QA / Playtester" },
    ],
    cybersecurity: [
        { id: "pentester", label: "Penetration Tester" },
        { id: "security_eng", label: "Security Engineer" },
        { id: "soc_analyst", label: "SOC Analyst" },
        { id: "appsec", label: "AppSec Engineer" },
    ],
    ui_ux: [
        { id: "ui_designer", label: "UI Designer" },
        { id: "ux_researcher", label: "UX Researcher" },
        { id: "product_designer", label: "Product Designer" },
        { id: "motion_designer", label: "Motion Designer" },
    ],
    devops: [
        { id: "devops_eng", label: "DevOps Engineer" },
        { id: "sre", label: "Site Reliability" },
        { id: "cloud_arch", label: "Cloud Architect" },
        { id: "platform_eng", label: "Platform Engineer" },
    ],
    backend: [
        { id: "backend_dev", label: "Backend Developer" },
        { id: "api_engineer", label: "API Engineer" },
        { id: "db_engineer", label: "Database Engineer" },
        { id: "systems_eng", label: "Systems Engineer" },
    ],
    open_source: [
        { id: "core_contrib", label: "Core Contributor" },
        { id: "docs_writer", label: "Documentation Writer" },
        { id: "maintainer", label: "Maintainer" },
        { id: "triager", label: "Issue Triager" },
    ],
    startup: [
        { id: "founder", label: "Founder / Builder" },
        { id: "tech_lead", label: "Tech Lead" },
        { id: "product_mgr", label: "Product Manager" },
        { id: "growth", label: "Growth / Marketing" },
    ],
};

const EXPERIENCE_LEVELS = [
    {
        id: "BEGINNER",
        label: "Beginner",
        description: "Built tutorials, know the basics, haven't shipped anything team-based.",
        icon: "/icons8-beginner-100.png",
        tag: "0–1 yrs",
    },
    {
        id: "INTERMEDIATE",
        label: "Intermediate",
        description: "Built real projects, comfortable with Git, can work from issues and tasks.",
        icon: "/icons8-development-skill-32.png",
        tag: "1–3 yrs",
    },
    {
        id: "ADVANCED",
        label: "Advanced",
        description: "Shipped products, worked with teams, can lead modules and review others.",
        icon: "/icons8-developer-100.png",
        tag: "3+ yrs",
    },
];

const AVAILABILITY_OPTIONS = [
    { id: "WEEKEND", label: "Weekends only", description: "~4–8 hrs/week", icon: "/icons8-holiday-100.png" },
    { id: "LIGHT", label: "Light", description: "1–2 hrs/day", icon: "/icons8-clock-32.png" },
    { id: "MODERATE", label: "Moderate", description: "3–5 hrs/day", icon: "/icons8-timer-32.png" },
    { id: "FULLTIME", label: "Full-time", description: "6+ hrs/day", icon: "/icons8-time-limit-50.png" },
];

const GOALS = [
    { id: "join_projects", label: "Join existing projects" },
    { id: "build_portfolio", label: "Build my portfolio" },
    { id: "find_teammates", label: "Find teammates" },
    { id: "real_experience", label: "Gain real experience" },
    { id: "internship_prep", label: "Prepare for internships / jobs" },
    { id: "startup_ideas", label: "Build a startup idea" },
    { id: "open_source", label: "Contribute to open source" },
    { id: "explore", label: "Explore domains" },
];

const DOMAIN_LABELS: Record<string, string> = Object.fromEntries(
    DOMAINS.map((d) => [d.id, d.label])
);

function getProjectSuggestions(domain: string): string[] {
    const base: Record<string, string[]> = {
        web_dev: ["SaaS dashboards", "admin panels", "startup MVPs", "e-commerce stores"],
        app_dev: ["mobile utilities", "social apps", "fitness trackers", "marketplace apps"],
        ai_ml: ["ML pipelines", "data dashboards", "NLP tools", "recommendation systems"],
        game_dev: ["indie games", "game jam entries", "puzzle prototypes", "multiplayer demos"],
        cybersecurity: ["CTF challenges", "security tools", "audit scripts", "awareness platforms"],
        ui_ux: ["design systems", "SaaS UI kits", "landing pages", "user research reports"],
        devops: ["CI/CD pipelines", "infra setups", "monitoring dashboards", "automation tools"],
        backend: ["REST APIs", "microservices", "data pipelines", "auth systems"],
        open_source: ["library contributions", "CLI tools", "developer utilities", "docs sites"],
        startup: ["startup MVPs", "pitch decks", "growth experiments", "product launches"],
    };
    return base[domain] ?? ["collaborative projects", "team-based builds", "real-world products"];
}

const TOTAL_STEPS = 6;

// ─── SHARED UI ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
    const pct = Math.round((step / TOTAL_STEPS) * 100);
    return (
        <div className="w-full max-w-xl mx-auto px-6 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-medium">
                    Building your profile
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                    {step < TOTAL_STEPS ? `Step ${step + 1} of ${TOTAL_STEPS}` : "Complete"}
                </span>
            </div>
            <div className="h-0.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function NavButtons({
    onBack,
    onNext,
    nextLabel = "Continue",
    nextDisabled = false,
    loading = false,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    loading?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 mt-8">
            {onBack && (
                <button onClick={onBack} className="btn-ghost">
                    Back
                </button>
            )}
            <button
                onClick={onNext}
                disabled={nextDisabled || loading}
                className="btn-action flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {loading ? "Saving…" : nextLabel}
            </button>
        </div>
    );
}

// ─── STEP 0 — MISSION ────────────────────────────────────────────────────────

const MISSIONS = [
    {
        id: "JOIN_PROJECT",
        title: "Join Existing Projects",
        description: "Work with active teams, contribute to real products, and build execution experience.",
        icon: "/icons8-add-male-user-group-64.png",
        tag: "Most common",
    },
    {
        id: "START_PROJECT",
        title: "Start Your Own Project",
        description: "Create a project, recruit contributors, assign tasks, and build something real.",
        icon: "/icons8-start-50.png",
        tag: "",
    },
    {
        id: "FIND_TEAM",
        title: "Find a Team",
        description: "Discover builders with shared interests and form a high-execution team.",
        icon: "/icons8-find-100.png",
        tag: "",
    },
];

function MissionStep({ onNext }: { onNext: (mission: string) => void }) {
    const [selected, setSelected] = useState<string>("");

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">What are you here to do?</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Choose your primary intent — you can always do more later.</p>

            <div className="flex flex-col gap-3">
                {MISSIONS.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setSelected(m.id)}
                        className={`card-hover text-left p-5 rounded-xl border transition-all duration-200 ${selected === m.id
                                ? "border-[var(--accent)] bg-[var(--surface2)]"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Image
                                    src={m.icon}
                                    alt={m.title}
                                    width={32}
                                    height={32}
                                    className="opacity-80"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-[var(--text)]">{m.title}</p>
                                    {m.tag && (
                                        <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] tracking-wide">
                                            {m.tag}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--muted)] leading-relaxed">{m.description}</p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 mt-1 transition-all ${selected === m.id
                                    ? "border-[var(--accent)] bg-[var(--accent)]"
                                    : "border-[var(--border)]"
                                }`} />
                        </div>
                    </button>
                ))}
            </div>

            <NavButtons onNext={() => selected && onNext(selected)} nextDisabled={!selected} />
        </div>
    );
}

// ─── STEP 1 — DOMAIN ─────────────────────────────────────────────────────────

function DomainStep({ onNext, onBack }: { onNext: (domain: string) => void; onBack: () => void }) {
    const [selected, setSelected] = useState<string>("");

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">Choose your domain</h2>
            <p className="text-sm text-[var(--muted)] mb-6">What area are you building in?</p>

            <div className="grid grid-cols-2 gap-2">
                {DOMAINS.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelected(d.id)}
                        className={`card-hover text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${selected === d.id
                                ? "border-[var(--accent)] bg-[var(--surface2)]"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                    >
                        <Image
                            src={d.icon}
                            alt={d.label}
                            width={18}
                            height={18}
                            className="flex-shrink-0 opacity-60"
                        />
                        <span className="text-xs font-medium text-[var(--text)] leading-tight">{d.label}</span>
                    </button>
                ))}
            </div>

            <NavButtons onBack={onBack} onNext={() => selected && onNext(selected)} nextDisabled={!selected} />
        </div>
    );
}

// ─── STEP 2 — ROLE ───────────────────────────────────────────────────────────

function RoleStep({
    domain,
    onNext,
    onBack,
}: {
    domain: string;
    onNext: (role: string) => void;
    onBack: () => void;
}) {
    const [selected, setSelected] = useState<string>("");
    const roles = ROLES_BY_DOMAIN[domain] ?? [];
    const domainLabel = DOMAIN_LABELS[domain] ?? domain;

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">Choose your role</h2>
            <p className="text-sm text-[var(--muted)] mb-6">
                Within <span className="text-[var(--text)] font-medium">{domainLabel}</span>, what&apos;s your primary role?
            </p>

            <div className="flex flex-col gap-1.5">
                {roles.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        className={`card-hover text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${selected === r.id
                                ? "border-[var(--accent)] bg-[var(--surface2)]"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                    >
                        <span className="text-sm font-medium text-[var(--text)]">{r.label}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-all ${selected === r.id
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--border)]"
                            }`} />
                    </button>
                ))}
            </div>

            <NavButtons onBack={onBack} onNext={() => selected && onNext(selected)} nextDisabled={!selected} />
        </div>
    );
}

// ─── STEP 3 — EXPERIENCE ─────────────────────────────────────────────────────

function ExperienceStep({ onNext, onBack }: { onNext: (level: string) => void; onBack: () => void }) {
    const [selected, setSelected] = useState<string>("");

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">What&apos;s your experience level?</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Be honest — this shapes which projects you&apos;ll be matched with.</p>

            <div className="flex flex-col gap-2">
                {EXPERIENCE_LEVELS.map((e) => (
                    <button
                        key={e.id}
                        onClick={() => setSelected(e.id)}
                        className={`card-hover text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${selected === e.id
                                ? "border-[var(--accent)] bg-[var(--surface2)]"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                    >
                        <Image
                            src={e.icon}
                            alt={e.label}
                            width={28}
                            height={28}
                            className="flex-shrink-0 mt-0.5 opacity-70"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-[var(--text)]">{e.label}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)]">
                                    {e.tag}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--muted)] leading-relaxed">{e.description}</p>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 mt-1 transition-all ${selected === e.id
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--border)]"
                            }`} />
                    </button>
                ))}
            </div>

            <NavButtons onBack={onBack} onNext={() => selected && onNext(selected)} nextDisabled={!selected} />
        </div>
    );
}

// ─── STEP 4 — AVAILABILITY ───────────────────────────────────────────────────

function AvailabilityStep({ onNext, onBack }: { onNext: (avail: string) => void; onBack: () => void }) {
    const [selected, setSelected] = useState<string>("");

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">How much time can you commit?</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Reliable contributors beat inconsistent ones. Pick what you can actually sustain.</p>

            <div className="grid grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map((a) => (
                    <button
                        key={a.id}
                        onClick={() => setSelected(a.id)}
                        className={`card-hover text-left p-4 rounded-xl border transition-all duration-200 ${selected === a.id
                                ? "border-[var(--accent)] bg-[var(--surface2)]"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                    >
                        <Image
                            src={a.icon}
                            alt={a.label}
                            width={24}
                            height={24}
                            className="mb-2.5 opacity-60"
                        />
                        <p className="text-sm font-semibold text-[var(--text)] mb-0.5">{a.label}</p>
                        <p className="text-[11px] text-[var(--muted)]">{a.description}</p>
                    </button>
                ))}
            </div>

            <NavButtons onBack={onBack} onNext={() => selected && onNext(selected)} nextDisabled={!selected} />
        </div>
    );
}

// ─── STEP 5 — GOALS ──────────────────────────────────────────────────────────

function GoalsStep({
    onNext,
    onBack,
}: {
    onNext: (goals: string[]) => void;
    onBack: () => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);

    function toggle(id: string) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">What do you want to build toward?</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Select all that apply.</p>

            <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                    const active = selected.includes(g.id);
                    return (
                        <button
                            key={g.id}
                            onClick={() => toggle(g.id)}
                            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${active
                                    ? "border-[var(--accent)] bg-[var(--surface2)] text-[var(--text)]"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--text)]"
                                }`}
                        >
                            {g.label}
                        </button>
                    );
                })}
            </div>

            <NavButtons
                onBack={onBack}
                onNext={() => onNext(selected)}
                nextLabel="Generate my profile"
            />
        </div>
    );
}

// ─── STEP 6 — BUILDER PROFILE RESULT ─────────────────────────────────────────

function ProfileResult({
    mission,
    domain,
    role,
    experienceLevel,
    availability,
    goals,
    onRedo,
}: {
    mission: string;
    domain: string;
    role: string;
    experienceLevel: string;
    availability: string;
    goals: string[];
    onRedo: () => void;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const domainLabel = DOMAIN_LABELS[domain] ?? domain;
    const roleLabel = ROLES_BY_DOMAIN[domain]?.find((r) => r.id === role)?.label ?? role;
    const expLabel = EXPERIENCE_LEVELS.find((e) => e.id === experienceLevel)?.label ?? experienceLevel;
    const availLabel = AVAILABILITY_OPTIONS.find((a) => a.id === availability)?.label ?? availability;
    const suggestions = getProjectSuggestions(domain);

    const ctaByMission: Record<string, { label: string; href: string }[]> = {
        JOIN_PROJECT: [{ label: "Browse Projects", href: "/projects" }, { label: "Complete Profile", href: "/profile" }],
        START_PROJECT: [{ label: "Create a Project", href: "/projects/new" }, { label: "Complete Profile", href: "/profile" }],
        FIND_TEAM: [{ label: "Browse Projects", href: "/projects" }, { label: "Community", href: "/community" }],
    };
    const ctas = ctaByMission[mission] ?? ctaByMission["JOIN_PROJECT"];

    async function save(href: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mission, domain, role, experienceLevel, availability, goals }),
            });
            if (!res.ok) throw new Error("Failed to save");
            router.push(href);
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Identity card */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-4">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-medium mb-3">
                    Builder Profile
                </p>
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">{roleLabel}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {[expLabel, domainLabel, availLabel].map((t) => (
                        <span
                            key={t}
                            className="text-[11px] px-2.5 py-1 rounded border border-[var(--border)] text-[var(--muted)] bg-[var(--surface2)]"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)] mb-4" />

            {/* Contribution areas */}
            <div className="mb-4">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-2.5">
                    Ready to contribute to
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                        <span
                            key={s}
                            className="px-2.5 py-1 rounded text-xs border border-[var(--border)] text-[var(--text)] bg-[var(--surface)]"
                        >
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Goals */}
            {goals.length > 0 && (
                <div className="mb-5">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-2.5">
                        Building toward
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {goals.map((gId) => {
                            const g = GOALS.find((x) => x.id === gId);
                            return g ? (
                                <span
                                    key={gId}
                                    className="px-2.5 py-1 rounded text-xs border border-[var(--border)] text-[var(--muted)] bg-[var(--surface)]"
                                >
                                    {g.label}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-[var(--border)] mb-5" />

            {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

            {/* CTAs */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => save(ctas[0].href)}
                    disabled={loading}
                    className="btn-action w-full disabled:opacity-50"
                >
                    {loading ? "Saving…" : `${ctas[0].label} →`}
                </button>
                {ctas[1] && (
                    <button
                        onClick={() => save(ctas[1].href)}
                        disabled={loading}
                        className="btn-ghost w-full disabled:opacity-50"
                    >
                        {ctas[1].label}
                    </button>
                )}
                <button
                    onClick={onRedo}
                    disabled={loading}
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] py-1 transition-colors"
                >
                    ← Edit my answers
                </button>
            </div>
        </div>
    );
}

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────────────────────

export default function OnboardingClient() {
    const [step, setStep] = useState(0);
    const [mission, setMission] = useState("");
    const [domain, setDomain] = useState("");
    const [role, setRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [availability, setAvailability] = useState("");
    const [goals, setGoals] = useState<string[]>([]);

    return (
        <div style={{ minHeight: "calc(100vh - 56px)" }}>
            <ProgressBar step={step} />
            <div className="max-w-xl mx-auto px-6 py-8">
                {step === 0 && (
                    <MissionStep onNext={(v) => { setMission(v); setStep(1); }} />
                )}
                {step === 1 && (
                    <DomainStep
                        onNext={(v) => { setDomain(v); setRole(""); setStep(2); }}
                        onBack={() => setStep(0)}
                    />
                )}
                {step === 2 && (
                    <RoleStep
                        domain={domain}
                        onNext={(v) => { setRole(v); setStep(3); }}
                        onBack={() => setStep(1)}
                    />
                )}
                {step === 3 && (
                    <ExperienceStep
                        onNext={(v) => { setExperienceLevel(v); setStep(4); }}
                        onBack={() => setStep(2)}
                    />
                )}
                {step === 4 && (
                    <AvailabilityStep
                        onNext={(v) => { setAvailability(v); setStep(5); }}
                        onBack={() => setStep(3)}
                    />
                )}
                {step === 5 && (
                    <GoalsStep
                        onNext={(v) => { setGoals(v); setStep(6); }}
                        onBack={() => setStep(4)}
                    />
                )}
                {step === 6 && (
                    <ProfileResult
                        mission={mission}
                        domain={domain}
                        role={role}
                        experienceLevel={experienceLevel}
                        availability={availability}
                        goals={goals}
                        onRedo={() => setStep(0)}
                    />
                )}
            </div>
        </div>
    );
}