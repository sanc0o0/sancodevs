"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ProjectCard from "@/components/projects/ProjectCard";
import type { ProjectCardProject } from "@/components/projects/ProjectCard";

// ─── FILTER DATA ──────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
    { label: "Beginner Friendly", key: "difficulty", value: "Beginner" },
    { label: "Startup Ideas", key: "projectType", value: "Startup" },
    { label: "Open Source", key: "projectType", value: "Open Source" },
    { label: "Team Projects", key: "collaborationType", value: "TEAM" },
    { label: "AI Powered", key: "domain", value: "ai_ml" },
    { label: "Full Stack", key: "domain", value: "web_dev" },
];

const FILTERS = {
    difficulty: ["Beginner", "Intermediate", "Advanced"],
    techStack: {
        Frontend: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Svelte", "Tailwind CSS"],
        Backend: ["Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Go", "Rust", "FastAPI"],
        Database: ["PostgreSQL", "MySQL", "MongoDB", "Firebase", "Supabase", "Redis", "SQLite"],
        Mobile: ["React Native", "Flutter", "Swift", "Kotlin"],
        "AI / ML": ["OpenAI API", "TensorFlow", "PyTorch", "LangChain", "Hugging Face"],
        DevOps: ["Docker", "Kubernetes", "AWS", "GCP", "Vercel", "CI/CD", "Linux"],
    },
    projectType: ["Startup", "SaaS", "Open Source", "Research", "Hackathon"],
    domain: [
        { label: "Web Dev", value: "web_dev" },
        { label: "AI / ML", value: "ai_ml" },
        { label: "Game Dev", value: "game_dev" },
        { label: "Cybersecurity", value: "cybersecurity" },
        { label: "Mobile", value: "mobile" },
        { label: "DevOps", value: "devops" },
        { label: "Data Science", value: "data" },
    ],
    phase: [
        { label: "Idea", value: "IDEA" },
        { label: "Planning", value: "PLANNING" },
        { label: "Building", value: "BUILDING" },
        { label: "Testing", value: "TESTING" },
        { label: "Launched", value: "LAUNCHED" },
    ],
    estimatedDuration: ["1_WEEK", "1_MONTH", "3_MONTHS", "6_MONTHS"],
    collaborationType: [
        { label: "Solo", value: "SOLO" },
        { label: "Team", value: "TEAM" },
    ],
    monetization: ["No Monetization", "Freelance Ready", "SaaS Potential", "Startup Scalable"],
};

type ActiveFilters = {
    difficulty: string[];
    techStack: string[];
    projectType: string[];
    domain: string[];
    phase: string[];
    estimatedDuration: string[];
    collaborationType: string[];
    monetization: string[];
};

const emptyFilters = (): ActiveFilters => ({
    difficulty: [], techStack: [], projectType: [], domain: [],
    phase: [], estimatedDuration: [], collaborationType: [], monetization: [],
});

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
    initialProjects: ProjectCardProject[];
    currentUserId: string;
    memberProjectIds?: string[];
    pendingProjectIds?: string[];
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProjectsClient({
    initialProjects,
    currentUserId,
    memberProjectIds = [],
    pendingProjectIds = [],
}: Props) {
    const [filters, setFilters] = useState<ActiveFilters>(emptyFilters());
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"newest" | "popular">("newest");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        difficulty: true, techStack: true, projectType: false,
        domain: false, phase: false, estimatedDuration: false,
        collaborationType: false, monetization: false,
    });

    function toggleFilter(category: keyof ActiveFilters, value: string) {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(v => v !== value)
                : [...prev[category], value],
        }));
    }

    function clearAll() { setFilters(emptyFilters()); setSearch(""); }
    function toggleSection(key: string) {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    }

    const activeFilterCount = Object.values(filters).flat().length;

    const filtered = useMemo(() => {
        let result = [...initialProjects];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.tagline ?? "").toLowerCase().includes(q) ||
                p.techStack.some((t: string) => t.toLowerCase().includes(q))
            );
        }

        if (filters.difficulty.length)
            result = result.filter(p => filters.difficulty.includes(p.difficulty));
        if (filters.techStack.length)
            result = result.filter(p => p.techStack.some((t: string) => filters.techStack.includes(t)));
        if (filters.projectType.length)
            result = result.filter(p => p.projectType && filters.projectType.includes(p.projectType));
        if (filters.domain.length)
            result = result.filter(p => p.domain && filters.domain.includes(p.domain));
        if (filters.phase.length)
            result = result.filter(p => p.phase && filters.phase.includes(p.phase));
        if (filters.estimatedDuration.length)
            result = result.filter(p => p.estimatedDuration && filters.estimatedDuration.includes(p.estimatedDuration));
        if (filters.collaborationType.length)
            result = result.filter(p => filters.collaborationType.includes(p.collaborationType));
        if (filters.monetization.length)
            result = result.filter(p => p.monetization && filters.monetization.includes(p.monetization));

        if (sort === "popular")
            result.sort((a, b) => b._count.applicants - a._count.applicants);
        else
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return result;
    }, [initialProjects, filters, search, sort]);

    return (
        <div style={{ height: "calc(100vh - 54px)", display: "flex", overflow: "hidden", padding: "24px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", width: "100%" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>

                    {/* Title row */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <div style={{ width: 24, height: 2, background: "var(--accent)", marginBottom: 10 }} />
                            <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text)", margin: 0, marginBottom: 4 }}>Projects</h1>
                            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                                Commit to a project. Ship it. No half-finished demos.
                            </p>
                        </div>
                        <Link
                            href="/projects/new"
                            className="btn-action"
                            style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 12 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New project
                        </Link>
                    </div>

                    {/* Quick filter chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {QUICK_FILTERS.map(qf => {
                            const active = filters[qf.key as keyof ActiveFilters]?.includes(qf.value);
                            return (
                                <button
                                    key={qf.label}
                                    onClick={() => toggleFilter(qf.key as keyof ActiveFilters, qf.value)}
                                    style={{
                                        padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                                        border: `0.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                                        background: active ? "var(--surface2)" : "transparent",
                                        color: active ? "var(--text)" : "var(--muted)",
                                        transition: "all 0.12s",
                                    }}
                                >
                                    {qf.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search + sort */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Search projects..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: 180 }}
                        />
                        <select
                            className="form-select"
                            title="Sort projects"
                            value={sort}
                            onChange={e => setSort(e.target.value as "newest" | "popular")}
                            style={{ width: 140 }}
                        >
                            <option value="newest">Newest</option>
                            <option value="popular">Most popular</option>
                        </select>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            style={{
                                display: "none", alignItems: "center", gap: 6,
                                padding: "8px 12px", borderRadius: 8, fontSize: 12,
                                border: "0.5px solid var(--border)", background: "transparent",
                                color: "var(--muted)", cursor: "pointer",
                            }}
                            className="show-mobile"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                            </span>
                            {Object.entries(filters).flatMap(([cat, vals]) =>
                                vals.map((val: string) => (
                                    <span key={`${cat}-${val}`} style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        padding: "3px 10px", borderRadius: 20, fontSize: 11,
                                        border: "0.5px solid var(--accent)",
                                        background: "var(--surface2)", color: "var(--text)",
                                    }}>
                                        {val}
                                        <button
                                            onClick={() => toggleFilter(cat as keyof ActiveFilters, val)}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, lineHeight: 1, padding: 0 }}
                                        >×</button>
                                    </span>
                                ))
                            )}
                            <button
                                onClick={clearAll}
                                style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* ── MAIN: filter sidebar + cards ── */}
                <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0, overflow: "hidden" }}>

                    {/* Desktop filter sidebar */}
                    <aside
                        className="hidden-mobile"
                        style={{ width: 200, flexShrink: 0, overflowY: "auto", borderRight: "0.5px solid var(--border)", paddingRight: 16 }}
                    >
                        <div style={{
                            position: "sticky", top: 0, background: "var(--bg)",
                            paddingBottom: 6, display: "flex", alignItems: "center",
                            justifyContent: "space-between", marginBottom: 8,
                        }}>
                            <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Filters
                            </span>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAll}
                                    style={{ fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                        <FilterPanel
                            filters={filters}
                            toggleFilter={toggleFilter}
                            expandedSections={expandedSections}
                            toggleSection={toggleSection}
                        />
                    </aside>

                    {/* Project list */}
                    <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
                        {filtered.length === 0 ? (
                            <div style={{
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                padding: "48px 24px", border: "0.5px solid var(--border)",
                                borderRadius: 10, background: "var(--surface)", textAlign: "center",
                            }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>
                                    No projects found
                                </p>
                                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                                    Try adjusting your filters or search term
                                </p>
                                <button onClick={clearAll} className="btn-ghost" style={{ fontSize: 12 }}>
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
                                {filtered.map(p => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p}
                                        isOwner={p.createdBy === currentUserId}
                                        currentUserId={currentUserId}
                                        isMember={memberProjectIds.includes(p.id)}
                                        hasPending={pendingProjectIds.includes(p.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── MOBILE FILTER DRAWER ── */}
                {drawerOpen && (
                    <>
                        <div
                            onClick={() => setDrawerOpen(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
                        />
                        <div style={{
                            position: "fixed", inset: "0 auto 0 0", width: 280,
                            background: "var(--bg)", borderRight: "0.5px solid var(--border)",
                            zIndex: 50, display: "flex", flexDirection: "column",
                            animation: "slideDown 0.2s ease",
                        }}>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 16px", borderBottom: "0.5px solid var(--border)", flexShrink: 0,
                            }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>Filters</p>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20 }}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                                <FilterPanel
                                    filters={filters}
                                    toggleFilter={toggleFilter}
                                    expandedSections={expandedSections}
                                    toggleSection={toggleSection}
                                />
                            </div>
                            <div style={{
                                padding: "12px 16px", borderTop: "0.5px solid var(--border)",
                                display: "flex", gap: 8,
                            }}>
                                <button onClick={clearAll} className="btn-ghost" style={{ flex: 1, fontSize: 12 }}>
                                    Clear all
                                </button>
                                <button onClick={() => setDrawerOpen(false)} className="btn-action" style={{ flex: 1, fontSize: 12 }}>
                                    Show {filtered.length}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────

function FilterPanel({ filters, toggleFilter, expandedSections, toggleSection }: {
    filters: ActiveFilters;
    toggleFilter: (cat: keyof ActiveFilters, val: string) => void;
    expandedSections: Record<string, boolean>;
    toggleSection: (key: string) => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FilterSection title="Difficulty" expanded={expandedSections.difficulty} onToggle={() => toggleSection("difficulty")}>
                {FILTERS.difficulty.map(v => (
                    <FilterCB key={v} label={v} checked={filters.difficulty.includes(v)} onChange={() => toggleFilter("difficulty", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Tech Stack" expanded={expandedSections.techStack} onToggle={() => toggleSection("techStack")}>
                {Object.entries(FILTERS.techStack).map(([group, techs]) => (
                    <div key={group} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                            {group}
                        </p>
                        {techs.map(v => (
                            <FilterCB key={v} label={v} checked={filters.techStack.includes(v)} onChange={() => toggleFilter("techStack", v)} />
                        ))}
                    </div>
                ))}
            </FilterSection>

            <FilterSection title="Project Type" expanded={expandedSections.projectType} onToggle={() => toggleSection("projectType")}>
                {FILTERS.projectType.map(v => (
                    <FilterCB key={v} label={v} checked={filters.projectType.includes(v)} onChange={() => toggleFilter("projectType", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Domain" expanded={expandedSections.domain} onToggle={() => toggleSection("domain")}>
                {FILTERS.domain.map(({ label, value }) => (
                    <FilterCB key={value} label={label} checked={filters.domain.includes(value)} onChange={() => toggleFilter("domain", value)} />
                ))}
            </FilterSection>

            <FilterSection title="Phase" expanded={expandedSections.phase} onToggle={() => toggleSection("phase")}>
                {FILTERS.phase.map(({ label, value }) => (
                    <FilterCB key={value} label={label} checked={filters.phase.includes(value)} onChange={() => toggleFilter("phase", value)} />
                ))}
            </FilterSection>

            <FilterSection title="Duration" expanded={expandedSections.estimatedDuration} onToggle={() => toggleSection("estimatedDuration")}>
                {FILTERS.estimatedDuration.map(v => (
                    <FilterCB key={v} label={v.replace("_", " ")} checked={filters.estimatedDuration.includes(v)} onChange={() => toggleFilter("estimatedDuration", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Collaboration" expanded={expandedSections.collaborationType} onToggle={() => toggleSection("collaborationType")}>
                {FILTERS.collaborationType.map(({ label, value }) => (
                    <FilterCB key={value} label={label} checked={filters.collaborationType.includes(value)} onChange={() => toggleFilter("collaborationType", value)} />
                ))}
            </FilterSection>

            <FilterSection title="Monetization" expanded={expandedSections.monetization} onToggle={() => toggleSection("monetization")}>
                {FILTERS.monetization.map(v => (
                    <FilterCB key={v} label={v} checked={filters.monetization.includes(v)} onChange={() => toggleFilter("monetization", v)} />
                ))}
            </FilterSection>
        </div>
    );
}

function FilterSection({ title, expanded, onToggle, children }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div style={{ borderBottom: "0.5px solid var(--border)", paddingBottom: expanded ? 8 : 0 }}>
            <button
                onClick={onToggle}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "9px 0", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                }}
            >
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{title}</span>
                <svg
                    width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="var(--muted)" strokeWidth="2"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {expanded && <div style={{ paddingBottom: 8 }}>{children}</div>}
        </div>
    );
}

function FilterCB({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={checked} onChange={onChange} style={{ flexShrink: 0, accentColor: "var(--accent)" }} />
            <span style={{ fontSize: 11, color: checked ? "var(--text)" : "var(--muted)", transition: "color 0.12s" }}>
                {label}
            </span>
        </label>
    );
}
