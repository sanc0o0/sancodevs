"use client";

import React from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ActiveFilters = {
    difficulty: string[];
    techStack: string[];
    projectType: string[];
    domain: string[];
    buildGoal: string[];
    estimatedDuration: string[];
    complexityType: string[];
    collaborationType: string[];
    monetization: string[];
};

export const emptyFilters = (): ActiveFilters => ({
    difficulty: [], techStack: [], projectType: [], domain: [],
    buildGoal: [], estimatedDuration: [], complexityType: [],
    collaborationType: [], monetization: [],
});

// ─── FILTER DATA ─────────────────────────────────────────────────────────────

export const FILTERS = {
    difficulty: ["Beginner", "Beginner+", "Intermediate", "Intermediate+", "Advanced", "Expert"],
    techStack: {
        Frontend: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Svelte", "Tailwind CSS"],
        Backend: ["Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Go", "Rust", "FastAPI"],
        Database: ["PostgreSQL", "MySQL", "MongoDB", "Firebase", "Supabase", "Redis", "SQLite"],
        Mobile: ["React Native", "Flutter", "Swift", "Kotlin"],
        "AI / ML": ["OpenAI API", "TensorFlow", "PyTorch", "LangChain", "Hugging Face"],
        DevOps: ["Docker", "Kubernetes", "AWS", "GCP", "Vercel", "CI/CD", "Linux"],
    },
    projectType: ["Web App", "Full Stack App", "API Service", "CLI Tool", "Mobile App", "Chrome Extension", "Desktop App", "Microservice"],
    domain: ["Education", "Fintech", "Health", "Social Media", "E-commerce", "Productivity", "Developer Tools", "AI Tools", "Gaming", "Content / Blogging"],
    buildGoal: ["Learn Basics", "Practice Concepts", "Resume Project", "Portfolio Project", "Real-world System", "Startup Idea", "Open Source Ready"],
    estimatedDuration: ["< 1 hour", "1–3 hours", "1 day", "2–3 days", "1 week", "2+ weeks"],
    complexityType: ["CRUD App", "Authentication System", "Real-time System", "API Integration", "Payment Integration", "AI-powered", "File Handling", "Background Jobs"],
    collaborationType: ["Solo Project", "Team Project"],
    monetization: ["No Monetization", "Freelance Ready", "SaaS Potential", "Startup Scalable"],
};

export const QUICK_FILTERS = [
    { label: "Beginner Friendly", key: "difficulty", value: "Beginner" },
    { label: "Startup Ideas", key: "buildGoal", value: "Startup Idea" },
    { label: "Open Source", key: "buildGoal", value: "Open Source Ready" },
    { label: "Team Projects", key: "collaborationType", value: "Team Project" },
    { label: "AI Powered", key: "complexityType", value: "AI-powered" },
    { label: "Full Stack", key: "projectType", value: "Full Stack App" },
];

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
    filters: ActiveFilters;
    toggleFilter: (cat: keyof ActiveFilters, val: string) => void;
    expandedSections: Record<string, boolean>;
    toggleSection: (key: string) => void;
}

export function FilterPanel({ filters, toggleFilter, expandedSections, toggleSection }: FilterPanelProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FilterSection title="Difficulty" expanded={expandedSections.difficulty} onToggle={() => toggleSection("difficulty")}>
                {FILTERS.difficulty.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.difficulty.includes(v)} onChange={() => toggleFilter("difficulty", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Tech Stack" expanded={expandedSections.techStack} onToggle={() => toggleSection("techStack")}>
                {Object.entries(FILTERS.techStack).map(([group, techs]) => (
                    <div key={group} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{group}</p>
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

            <FilterSection title="Domain" expanded={expandedSections.domain} onToggle={() => toggleSection("domain")}>
                {FILTERS.domain.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.domain.includes(v)} onChange={() => toggleFilter("domain", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Build Goal" expanded={expandedSections.buildGoal} onToggle={() => toggleSection("buildGoal")}>
                {FILTERS.buildGoal.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.buildGoal.includes(v)} onChange={() => toggleFilter("buildGoal", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Time to Complete" expanded={expandedSections.estimatedDuration} onToggle={() => toggleSection("estimatedDuration")}>
                {FILTERS.estimatedDuration.map(v => (
                    <FilterCheckbox key={v} label={v} checked={filters.estimatedDuration.includes(v)} onChange={() => toggleFilter("estimatedDuration", v)} />
                ))}
            </FilterSection>

            <FilterSection title="Complexity" expanded={expandedSections.complexityType} onToggle={() => toggleSection("complexityType")}>
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

function FilterSection({ title, expanded, onToggle, children }: {
    title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
    return (
        <div style={{ borderBottom: "0.5px solid var(--border)", paddingBottom: expanded ? 8 : 0 }}>
            <button
                onClick={onToggle}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "10px 0",
                    background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
            >
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{title}</span>
                <svg
                    width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="var(--muted)" strokeWidth="2"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {expanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 6 }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", cursor: "pointer" }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{ flexShrink: 0, accentColor: "var(--accent)", cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: checked ? "var(--text)" : "var(--muted)", transition: "color 0.1s" }}>
                {label}
            </span>
        </label>
    );
}

// ─── MOBILE DRAWER ────────────────────────────────────────────────────────────

interface FilterDrawerProps extends FilterPanelProps {
    open: boolean;
    onClose: () => void;
    onClearAll: () => void;
    resultCount: number;
    activeFilterCount: number;
}

export function FilterDrawer({
    open, onClose, onClearAll, resultCount, activeFilterCount,
    filters, toggleFilter, expandedSections, toggleSection,
}: FilterDrawerProps) {
    if (!open) return null;
    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, animation: "fadeIn 0.15s ease" }}
            />
            <div style={{
                position: "fixed", inset: "0 auto 0 0",
                width: "min(280px, 88vw)",
                background: "var(--bg)", borderRight: "0.5px solid var(--border)",
                zIndex: 50, display: "flex", flexDirection: "column",
                animation: "slideDown 0.2s ease",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>Filters</p>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
                    <FilterPanel filters={filters} toggleFilter={toggleFilter} expandedSections={expandedSections} toggleSection={toggleSection} />
                </div>
                <div style={{ padding: 12, borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={onClearAll} className="btn-ghost" style={{ flex: 1, fontSize: 12 }}>Clear all</button>
                    <button onClick={onClose} className="btn-action" style={{ flex: 1, fontSize: 12 }}>
                        Show {resultCount} results
                    </button>
                </div>
            </div>
        </>
    );
}