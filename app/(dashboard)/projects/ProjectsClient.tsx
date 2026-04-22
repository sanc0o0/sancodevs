"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FILTERS = {
    difficulty: ["Beginner", "Beginner+", "Intermediate", "Intermediate+", "Advanced", "Expert"],
    techStack: {
        Frontend: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Svelte", "Tailwind CSS"],
        Backend: ["Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Go", "Rust", "FastAPI"],
        Database: ["PostgreSQL", "MySQL", "MongoDB", "Firebase", "Supabase", "Redis", "SQLite"],
        Mobile: ["React Native", "Flutter", "Swift", "Kotlin"],
        "AI / ML": ["OpenAI API", "TensorFlow", "PyTorch", "LangChain", "Hugging Face"],
        "DevOps": ["Docker", "Kubernetes", "AWS", "GCP", "Vercel", "CI/CD", "Linux"],
    },
    projectType: ["Web App", "Full Stack App", "API Service", "CLI Tool", "Mobile App", "Chrome Extension", "Desktop App", "Microservice"],
    domain: ["Education", "Fintech", "Health", "Social Media", "E-commerce", "Productivity", "Developer Tools", "AI Tools", "Gaming", "Content / Blogging"],
    buildGoal: ["Learn Basics", "Practice Concepts", "Resume Project", "Portfolio Project", "Real-world System", "Startup Idea", "Open Source Ready"],
    timeToComplete: ["< 1 hour", "1–3 hours", "1 day", "2–3 days", "1 week", "2+ weeks"],
    complexityType: ["CRUD App", "Authentication System", "Real-time System", "API Integration", "Payment Integration", "AI-powered", "File Handling", "Background Jobs"],
    collaborationType: ["Solo Project", "Team Project"],
    monetization: ["No Monetization", "Freelance Ready", "SaaS Potential", "Startup Scalable"],
};

const QUICK_FILTERS = [
    { label: "Beginner Friendly", key: "difficulty", value: "Beginner" },
    { label: "Startup Ideas", key: "buildGoal", value: "Startup Idea" },
    { label: "Open Source", key: "buildGoal", value: "Open Source Ready" },
    { label: "Team Projects", key: "collaborationType", value: "Team Project" },
    { label: "AI Powered", key: "complexityType", value: "AI-powered" },
    { label: "Full Stack", key: "projectType", value: "Full Stack App" },
];

type Project = {
    id: string;
    title: string;
    description: string;
    status: string;
    difficulty: string;
    techStack: string[];
    projectType: string | null;
    domain: string | null;
    buildGoal: string | null;
    timeToComplete: string | null;
    complexityType: string[];
    collaborationType: string;
    monetization: string | null;
    createdAt: string;
    createdBy: string;
    _count: { applicants: number; teams: number };
};

type ActiveFilters = {
    difficulty: string[];
    techStack: string[];
    projectType: string[];
    domain: string[];
    buildGoal: string[];
    timeToComplete: string[];
    complexityType: string[];
    collaborationType: string[];
    monetization: string[];
};

const emptyFilters = (): ActiveFilters => ({
    difficulty: [], techStack: [], projectType: [], domain: [],
    buildGoal: [], timeToComplete: [], complexityType: [],
    collaborationType: [], monetization: [],
});

interface Props {
    initialProjects: Project[];
    currentUserId: string;
}

export default function ProjectsClient({ initialProjects, currentUserId }: Props) {
    const router = useRouter();
    const [filters, setFilters] = useState<ActiveFilters>(emptyFilters());
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"newest" | "popular">("newest");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        difficulty: true, techStack: true, projectType: false,
        domain: false, buildGoal: false, timeToComplete: false,
        complexityType: false, collaborationType: false, monetization: false,
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

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.techStack.some(t => t.toLowerCase().includes(q))
            );
        }

        // AND logic between categories, OR within
        if (filters.difficulty.length) result = result.filter(p => filters.difficulty.includes(p.difficulty));
        if (filters.techStack.length) result = result.filter(p => p.techStack.some(t => filters.techStack.includes(t)));
        if (filters.projectType.length) result = result.filter(p => p.projectType && filters.projectType.includes(p.projectType));
        if (filters.domain.length) result = result.filter(p => p.domain && filters.domain.includes(p.domain));
        if (filters.buildGoal.length) result = result.filter(p => p.buildGoal && filters.buildGoal.includes(p.buildGoal));
        if (filters.timeToComplete.length) result = result.filter(p => p.timeToComplete && filters.timeToComplete.includes(p.timeToComplete));
        if (filters.complexityType.length) result = result.filter(p => p.complexityType.some(c => filters.complexityType.includes(c)));
        if (filters.collaborationType.length) result = result.filter(p => filters.collaborationType.includes(p.collaborationType));
        if (filters.monetization.length) result = result.filter(p => p.monetization && filters.monetization.includes(p.monetization));

        // Sort
        if (sort === "popular") result.sort((a, b) => b._count.applicants - a._count.applicants);
        else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return result;
    }, [initialProjects, filters, search, sort]);

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "text-green-500 border-green-500/30",
        IN_PROGRESS: "text-blue-400 border-blue-400/30",
        CLOSED: "text-[var(--muted)] border-[var(--border)]",
        COMPLETED: "text-emerald-500 border-emerald-500/30",
        TERMINATED: "text-red-400 border-red-400/30",
    };

    return (
        <div style={{
            height: "calc(100vh - 54px)", // account for navbar
            display: "flex",
            overflow: "hidden",
            padding: "20px"
        }}>
            <div className="flex flex-col gap-4 h-full w-full">
                <div className="flex flex-col gap-4 flex-shrink-0">
                    {/* Header */}
                    <div className="flex items-end justify-between flex-wrap gap-3">
                        <div>
                            <div className="w-7 h-0.5 bg-[var(--accent)] mb-3" />
                            <h1 className="text-xl font-medium text-[var(--text)] mb-1">Projects</h1>
                            <p className="text-sm text-[var(--muted)]">Commit to a project. Ship it. No half-finished demos.</p>
                        </div>
                        <Link
                            href="/projects/new"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] no-underline transition-opacity hover:opacity-85 active:scale-[0.97]"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New project
                        </Link>
                    </div>

                    {/* Quick filter chips */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_FILTERS.map(qf => {
                            const isActive = filters[qf.key as keyof ActiveFilters]?.includes(qf.value);
                            return (
                                <button
                                    key={qf.label}
                                    onClick={() => toggleFilter(qf.key as keyof ActiveFilters, qf.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer
                                        ${isActive
                                            ? "border-[var(--accent)] bg-[var(--surface2)] text-[var(--text)]"
                                            : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
                                        }`}
                                >
                                    {qf.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search + sort + mobile filter trigger */}
                    <div className="flex gap-3 items-center flex-wrap">
                        <input
                            className="form-input flex-1 min-w-[200px]"
                            type="text"
                            placeholder="Search projects..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <select
                            className="form-select"
                            title="Sort projects"
                            aria-label="Sort projects"
                            value={sort}
                            onChange={e => setSort(e.target.value as "newest" | "popular")}
                            style={{ width: "140px" }}
                        >
                            <option value="newest">Newest</option>
                            <option value="popular">Most popular</option>
                        </select>
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="show-mobile flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--muted)] cursor-pointer"
                            style={{ display: "none" }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-[var(--muted)]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                            {Object.entries(filters).flatMap(([cat, vals]) =>
                                vals.map(val => (
                                    <span key={`${cat}-${val}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-[var(--accent)] bg-[var(--surface2)] text-[var(--text)]">
                                        {val}
                                        <button
                                            onClick={() => toggleFilter(cat as keyof ActiveFilters, val)}
                                            className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-sm leading-none"
                                        >×</button>
                                    </span>
                                ))
                            )}
                            <button onClick={clearAll} className="text-xs text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer underline">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Main layout */}
                <div className="flex gap-5 flex-1 min-h-0 overflow-hidden">
                    {/* Desktop filter sidebar */}
                    <aside
                        className="hidden-mobile"
                        style={{
                            width: "220px",
                            flexShrink: 0,
                            overflowY: "auto",
                            borderRight: "0.5px solid var(--border)",
                            padding: "1.5rem 1rem",
                        }}
                    >
                        <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center justify-between">
                            <span>Filters</span>
                            {activeFilterCount > 0 && (
                                <button onClick={clearAll} className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer">
                                    Clear
                                </button>
                            )}
                        </div>
                        <FilterPanel filters={filters} toggleFilter={toggleFilter} expandedSections={expandedSections} toggleSection={toggleSection} />
                    </aside>

                    {/* Projects list */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "1.5rem 2rem",
                            minWidth: 0,
                        }}
                    >
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-center">
                                <div className="w-7 h-0.5 bg-[var(--border)] mb-4 mx-auto" />
                                <p className="text-sm font-medium text-[var(--text)] mb-2">No projects found</p>
                                <p className="text-xs text-[var(--muted)] mb-4">Try adjusting your filters or search term</p>
                                <button onClick={clearAll} className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer hover:text-[var(--text)]">
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            filtered.map(p => {
                                const isOwner = p.createdBy === currentUserId;
                                return (
                                    <div key={p.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)] transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-[var(--text)]">{p.title}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS[p.status] ?? "text-[var(--muted)] border-[var(--border)]"}`}>
                                                    {p.status}
                                                </span>
                                                {p.difficulty && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                                                        {p.difficulty}
                                                    </span>
                                                )}
                                            </div>
                                            {isOwner && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                                                    Your project
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-[var(--muted)] leading-relaxed mb-3 line-clamp-2">{p.description}</p>

                                        {/* Tech stack tags */}
                                        {p.techStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {p.techStack.slice(0, 5).map(t => (
                                                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)]">
                                                        {t}
                                                    </span>
                                                ))}
                                                {p.techStack.length > 5 && (
                                                    <span className="text-[10px] text-[var(--muted)]">+{p.techStack.length - 5} more</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] text-[var(--muted)]">{p._count.applicants} applicant{p._count.applicants !== 1 ? "s" : ""}</span>
                                                <span className="text-[11px] text-[var(--muted)]">{p._count.teams} on team</span>
                                                {p.timeToComplete && (
                                                    <span className="text-[11px] text-[var(--muted)]">{p.timeToComplete}</span>
                                                )}
                                            </div>
                                            <Link
                                                href={`/projects/${p.id}`}
                                                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] no-underline hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
                                            >
                                                View →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Mobile filter drawer */}
                {drawerOpen && (
                    <>
                        <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/50 z-60" />
                        <div className="fixed inset-y-0 left-0 w-72 bg-[var(--bg)] border-r border-[var(--border)] z-70 flex flex-col" style={{ animation: "slideDown 0.2s ease" }}>
                            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] flex-shrink-0">
                                <p className="text-sm font-medium text-[var(--text)]">Filters</p>
                                <button onClick={() => setDrawerOpen(false)} className="text-[var(--muted)] bg-none border-none cursor-pointer text-xl">×</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <FilterPanel filters={filters} toggleFilter={toggleFilter} expandedSections={expandedSections} toggleSection={toggleSection} />
                            </div>
                            <div className="p-4 border-t border-[var(--border)] flex gap-2">
                                <button onClick={clearAll} className="flex-1 py-2 rounded-lg text-sm border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">
                                    Clear all
                                </button>
                                <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2 rounded-lg text-sm bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer">
                                    Show {filtered.length} results
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

    );
}

function FilterPanel({ filters, toggleFilter, expandedSections, toggleSection }: {
    filters: ActiveFilters;
    toggleFilter: (category: keyof ActiveFilters, value: string) => void;
    expandedSections: Record<string, boolean>;
    toggleSection: (key: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1 ">
            <FilterSection title="Difficulty" expanded={expandedSections.difficulty} onToggle={() => toggleSection("difficulty")}>
                {FILTERS.difficulty.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.difficulty.includes(v)} onChange={() => toggleFilter("difficulty", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Tech Stack" expanded={expandedSections.techStack} onToggle={() => toggleSection("techStack")}>
                {Object.entries(FILTERS.techStack).map(([group, techs]) => (
                    <div key={group} className="mb-3">
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">{group}</p>
                        {techs.map(v => (
                            <FilterCheckbox key={v} label={v} checked={filters.techStack.includes(v)} onChange={() => toggleFilter("techStack", v)} />
                        ))}
                    </div>
                ))}
            </FilterSection>

            <FilterSection title="Project Type" expanded={expandedSections.projectType} onToggle={() => toggleSection("projectType")}>
                {FILTERS.projectType.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.projectType.includes(v)} onChange={() => toggleFilter("projectType", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Domain / Industry" expanded={expandedSections.domain} onToggle={() => toggleSection("domain")}>
                {FILTERS.domain.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.domain.includes(v)} onChange={() => toggleFilter("domain", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Build Goal" expanded={expandedSections.buildGoal} onToggle={() => toggleSection("buildGoal")}>
                {FILTERS.buildGoal.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.buildGoal.includes(v)} onChange={() => toggleFilter("buildGoal", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Time to Complete" expanded={expandedSections.timeToComplete} onToggle={() => toggleSection("timeToComplete")}>
                {FILTERS.timeToComplete.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.timeToComplete.includes(v)} onChange={() => toggleFilter("timeToComplete", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Complexity Type" expanded={expandedSections.complexityType} onToggle={() => toggleSection("complexityType")}>
                {FILTERS.complexityType.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.complexityType.includes(v)} onChange={() => toggleFilter("complexityType", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Collaboration" expanded={expandedSections.collaborationType} onToggle={() => toggleSection("collaborationType")}>
                {FILTERS.collaborationType.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.collaborationType.includes(v)} onChange={() => toggleFilter("collaborationType", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Monetization" expanded={expandedSections.monetization} onToggle={() => toggleSection("monetization")}>
                {FILTERS.monetization.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.monetization.includes(v)} onChange={() => toggleFilter("monetization", v)} />
                ))}
            </FilterSection>
        </div>
    );
}

function FilterSection({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="border-b border-[var(--border)] py-2">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-1.5 bg-none border-none cursor-pointer text-left"
            >
                <span className="text-xs font-medium text-[var(--text)]">{title}</span>
                <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="var(--muted)" strokeWidth="2"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {expanded && (
                <div className="pb-2 flex flex-col gap-0.5">
                    {children}
                </div>
            )}
        </div>
    );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <label className="flex items-center gap-2 py-0.5 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="flex-shrink-0 accent-[var(--accent)]"
            />
            <span className={`text-xs transition-colors ${checked ? "text-[var(--text)]" : "text-[var(--muted)] group-hover:text-[var(--text)]"}`}>
                {label}
            </span>
        </label>
    );
}