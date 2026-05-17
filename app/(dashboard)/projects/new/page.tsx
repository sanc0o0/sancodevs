"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TECH_OPTIONS = [
    "Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Python",
    "PostgreSQL", "MongoDB", "MySQL", "SQLite", "Redis", "Docker", "Kubernetes",
    "GraphQL", "REST APIs", "Tailwind CSS", "Prisma", "Drizzle", "Supabase",
    "Firebase", "Go", "Rust", "Vue.js", "Angular", "Svelte", "SvelteKit",
    "Remix", "Astro", "AWS", "GCP", "Azure", "Vercel", "Netlify", "Railway",
    "GitHub Actions", "Linux", "Nginx", "Socket.io", "WebSockets", "Jest",
    "Cypress", "Playwright", "Vite", "Webpack", "Electron", "React Native",
    "Flutter", "Swift", "Kotlin", "Java", "C++", "C#", "PHP", "Ruby",
    "Spring Boot", "Django", "FastAPI", "Flask", "Express.js", "NestJS",
    "Hono", "Bun", "Deno", "Three.js", "D3.js", "TensorFlow", "PyTorch",
    "Pandas", "NumPy", "Scikit-learn", "OpenAI API", "LangChain", "Pinecone",
    "Stripe", "Twilio", "SendGrid", "Cloudflare", "Terraform", "Ansible",
];

const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"];

const DOMAIN_OPTIONS = [
    { label: "Web Development", value: "web_dev" },
    { label: "AI / ML", value: "ai_ml" },
    { label: "Game Development", value: "game_dev" },
    { label: "Cybersecurity", value: "cybersecurity" },
    { label: "Mobile", value: "mobile" },
    { label: "DevOps / Infra", value: "devops" },
    { label: "Data Science", value: "data" },
];

const PROJECT_TYPE_OPTIONS = ["Startup", "SaaS", "Open Source", "Research", "Hackathon"];

const PHASE_OPTIONS = [
    { label: "Idea", value: "IDEA" },
    { label: "Planning", value: "PLANNING" },
    { label: "Building", value: "BUILDING" },
    { label: "Testing", value: "TESTING" },
    { label: "Launched", value: "LAUNCHED" },
];

const ROLE_SUGGESTIONS = [
    "Frontend Dev", "Backend Dev", "Full Stack Dev", "UI/UX Designer",
    "DevOps Engineer", "ML Engineer", "Mobile Dev", "QA Engineer",
    "Data Engineer", "Product Manager", "Technical Writer",
];

const DURATION_OPTIONS = [
    { label: "1 Week", value: "1_WEEK" },
    { label: "1 Month", value: "1_MONTH" },
    { label: "3 Months", value: "3_MONTHS" },
    { label: "6 Months", value: "6_MONTHS" },
];

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: "0.5px solid var(--border)", background: "var(--bg)",
    color: "var(--text)", fontSize: "13px", outline: "none",
    transition: "border-color 0.15s", boxSizing: "border-box",
    fontFamily: "inherit",
};

const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        (e.currentTarget.style.borderColor = "var(--accent)"),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        (e.currentTarget.style.borderColor = "var(--border)"),
};

// ─── LAYOUT HELPERS ───────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div style={{
            padding: "1.25rem 1.5rem", borderRadius: "10px",
            border: "0.5px solid var(--border)", background: "var(--surface)",
        }}>
            <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                    {title}
                </p>
                {subtitle && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.7, margin: "3px 0 0" }}>{subtitle}</p>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                {label}
                {hint && <span style={{ opacity: 0.6, marginLeft: 4 }}>— {hint}</span>}
            </label>
            {children}
        </div>
    );
}

// ─── COVER IMAGE UPLOADER ─────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "done" | "error";

function CoverImageUploader({ value, onChange }: {
    value: string | null;
    onChange: (url: string | null) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [uploadError, setUploadError] = useState("");
    const [preview, setPreview] = useState<string | null>(value);
    const [isDragging, setIsDragging] = useState(false);

    async function handleFile(file: File) {
        // Show local preview immediately — feels instant
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        setUploadState("uploading");
        setUploadError("");

        const form = new FormData();
        form.append("file", file);

        try {
            const res = await fetch("/api/upload/project-image", { method: "POST", body: form });
            const data = await res.json();

            if (!res.ok) {
                setUploadError(data.error ?? "Upload failed.");
                setUploadState("error");
                setPreview(null);
                onChange(null);
                return;
            }

            onChange(data.url);
            setUploadState("done");
        } catch {
            setUploadError("Upload failed. Check your connection.");
            setUploadState("error");
            setPreview(null);
            onChange(null);
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    function handleRemove() {
        setPreview(null);
        onChange(null);
        setUploadState("idle");
        setUploadError("");
        if (inputRef.current) inputRef.current.value = "";
    }

    return (
        <div>
            <input
                title="Image"
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleInputChange}
            />

            {preview ? (
                /* ── Preview ── */
                <div style={{ position: "relative" }}>
                    {preview && (
                        <Image
                            src={preview}
                            alt="Cover preview"
                            width={600}
                            height={400}
                            style={{
                                width: "100%",
                                maxHeight: 220,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "0.5px solid var(--border)",
                                display: "block",
                            }}
                        />
                    )}

                    {/* Uploading overlay */}
                    {uploadState === "uploading" && (
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.6)", borderRadius: 8,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: 10,
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                                stroke="#fff" strokeWidth="2"
                                style={{ animation: "spin 0.75s linear infinite" }}>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                            </svg>
                            <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>Uploading…</span>
                        </div>
                    )}

                    {/* Action buttons (always visible on preview) */}
                    {uploadState !== "uploading" && (
                        <div style={{
                            position: "absolute", top: 10, right: 10,
                            display: "flex", gap: 6,
                        }}>
                            <button type="button" onClick={() => inputRef.current?.click()}
                                style={{
                                    padding: "5px 11px", borderRadius: 6, fontSize: 11,
                                    background: "rgba(0,0,0,0.72)", border: "0.5px solid rgba(255,255,255,0.15)",
                                    color: "#fff", cursor: "pointer", backdropFilter: "blur(6px)",
                                    fontFamily: "inherit",
                                }}>
                                Change
                            </button>
                            <button type="button" onClick={handleRemove}
                                style={{
                                    padding: "5px 11px", borderRadius: 6, fontSize: 11,
                                    background: "rgba(226,75,74,0.85)", border: "none",
                                    color: "#fff", cursor: "pointer", fontFamily: "inherit",
                                }}>
                                Remove
                            </button>
                        </div>
                    )}

                    {/* Done checkmark badge */}
                    {uploadState === "done" && (
                        <div style={{
                            position: "absolute", bottom: 10, left: 10,
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 9px", borderRadius: 20,
                            background: "rgba(34,197,94,0.15)", border: "0.5px solid rgba(34,197,94,0.4)",
                        }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Uploaded</span>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Drop zone ── */
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload cover image"
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{
                        border: `1px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 8, padding: "36px 20px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 10,
                        cursor: "pointer",
                        background: isDragging ? "rgba(55,138,221,0.05)" : "transparent",
                        transition: "all 0.15s",
                        outline: "none",
                    }}
                >
                    {/* Image icon */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke={isDragging ? "var(--accent)" : "var(--muted)"}
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: "stroke 0.15s" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2.5" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: isDragging ? "var(--accent)" : "var(--text)", margin: 0, fontWeight: 500, transition: "color 0.15s" }}>
                            {isDragging ? "Drop to upload" : "Upload cover image"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                            Drag & drop or click · JPEG, PNG, WebP · max 5 MB
                        </p>
                    </div>
                </div>
            )}

            {uploadError && (
                <p style={{ fontSize: 11, color: "#e24b4a", marginTop: 7, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {uploadError}
                </p>
            )}
        </div>
    );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────

export default function NewProjectPage() {
    const router = useRouter();
    const [state, setFormState] = useState<"idle" | "loading">("idle");
    const [error, setError] = useState("");

    // Core
    const [title, setTitle] = useState("");
    const [tagline, setTagline] = useState("");
    const [description, setDescription] = useState("");
    const [vision, setVision] = useState("");
    const [coverImage, setCoverImage] = useState<string | null>(null);

    // Classification
    const [domain, setDomain] = useState("");
    const [projectType, setProjectType] = useState("");
    const [difficulty, setDifficulty] = useState("Beginner");
    const [estimatedDuration, setEstDuration] = useState("");
    const [monetization, setMonetization] = useState("");
    const [phase, setPhase] = useState("IDEA");

    // Team
    const [collaborationType, setCollabType] = useState<"SOLO" | "TEAM">("TEAM");
    const [maxMembers, setMaxMembers] = useState("3");

    // Recruitment
    const [openRoles, setOpenRoles] = useState<string[]>([]);
    const [roleInput, setRoleInput] = useState("");
    const [contributorExp, setContributorExp] = useState("");

    // Tech
    const [techStack, setTechStack] = useState<string[]>([]);
    const [techSearch, setTechSearch] = useState("");

    // Links
    const [liveUrl, setLiveUrl] = useState("");
    const [repoUrl, setRepoUrl] = useState("");

    // Community
    const [createCommunity, setCreateCommunity] = useState(true);
    const [communityName, setCommunityName] = useState("");

    const filteredTech = TECH_OPTIONS.filter(t =>
        t.toLowerCase().includes(techSearch.toLowerCase()) && !techStack.includes(t)
    );

    function toggleTech(tech: string) {
        setTechStack(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    }

    function addRole(role: string) {
        const trimmed = role.trim();
        if (trimmed && !openRoles.includes(trimmed)) setOpenRoles(prev => [...prev, trimmed]);
        setRoleInput("");
    }
    function removeRole(role: string) { setOpenRoles(prev => prev.filter(r => r !== role)); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (techStack.length === 0) { setError("Select at least one technology."); return; }
        if (collaborationType === "TEAM" && openRoles.length === 0) {
            setError("Add at least one open role for team projects."); return;
        }

        setFormState("loading");
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    tagline: tagline || undefined,
                    description,
                    vision: vision || undefined,
                    coverImage: coverImage || undefined,
                    domain: domain || undefined,
                    projectType: projectType || undefined,
                    difficulty,
                    phase,
                    estimatedDuration: estimatedDuration || undefined,
                    monetization: monetization || undefined,
                    collaborationType,
                    maxMembers: collaborationType === "TEAM" ? parseInt(maxMembers) : 1,
                    openRoles,
                    contributorExpectations: contributorExp || undefined,
                    techStack,
                    liveUrl: liveUrl || undefined,
                    repoUrl: repoUrl || undefined,
                    createCommunity,
                    communityName: communityName || title,
                }),
            });

            if (res.ok) {
                router.push("/projects?created=true");
            } else {
                const d = await res.json();
                setError(d.error ?? "Something went wrong.");
                setFormState("idle");
            }
        } catch {
            setError("Failed to create project.");
            setFormState("idle");
        }
    }

    return (
        <div style={{ width: "100%", padding: "30px", margin: "0 auto" }}>
            <div style={{ width: "24px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                Create a project
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
                Once submitted, your project will be visible to all SancoDevs users.
                Others can apply to join. You commit to seeing it through.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* ── BASICS ── */}
                <Section title="Basics">
                    <Field label="Cover image" hint="logo, screenshot, or product banner">
                        <CoverImageUploader value={coverImage} onChange={setCoverImage} />
                    </Field>
                    <Field label="Project title *">
                        <input type="text" required value={title}
                            placeholder="e.g. Open-source habit tracker"
                            onChange={e => setTitle(e.target.value)}
                            style={inputStyle} {...focusHandlers}
                        />
                    </Field>
                    <Field label="Tagline" hint="one line that sells the idea">
                        <input type="text" value={tagline}
                            placeholder="e.g. The simplest way to track your daily wins"
                            onChange={e => setTagline(e.target.value)}
                            style={inputStyle} {...focusHandlers}
                        />
                    </Field>
                    <Field label="Description *">
                        <textarea required rows={4} value={description}
                            placeholder="What are you building? What problem does it solve? What will contributors learn?"
                            onChange={e => setDescription(e.target.value)}
                            style={{ ...inputStyle, resize: "vertical" }} {...focusHandlers}
                        />
                    </Field>
                    <Field label="Vision" hint="why this project matters long-term">
                        <textarea rows={2} value={vision}
                            placeholder="What does success look like in 1 year?"
                            onChange={e => setVision(e.target.value)}
                            style={{ ...inputStyle, resize: "vertical" }} {...focusHandlers}
                        />
                    </Field>
                </Section>

                {/* ── CLASSIFICATION ── */}
                <Section title="Classification">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                            gap: "10px",
                        }}
                    >
                        <Field label="Domain">
                            <select title="Project domain" value={domain}
                                onChange={e => setDomain(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                                <option value="">Select domain…</option>
                                {DOMAIN_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Project type">
                            <select title="Project type" value={projectType}
                                onChange={e => setProjectType(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                                <option value="">Select type…</option>
                                {PROJECT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Field label="Difficulty *">
                            <select title="Project difficulty" value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                                {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Project phase">
                            <select
                                title="Project phase"
                                value={phase}
                                onChange={e => setPhase(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }}
                                {...focusHandlers}
                            >
                                {PHASE_OPTIONS.map(p => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Estimated duration">
                            <select title="Estimated duration" value={estimatedDuration}
                                onChange={e => setEstDuration(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                                <option value="">Select duration…</option>
                                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </Field>
                    </div>
                    <Field label="Monetization model">
                        <select title="Monetization model" value={monetization}
                            onChange={e => setMonetization(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                            <option value="">Select model…</option>
                            <option value="No Monetization">No Monetization</option>
                            <option value="Freelance Ready">Freelance Ready</option>
                            <option value="SaaS Potential">SaaS Potential</option>
                            <option value="Startup Scalable">Startup Scalable</option>
                        </select>
                    </Field>
                </Section>

                {/* ── TEAM SETUP ── */}
                <Section title="Team setup">
                    <div style={{ display: "flex", gap: "8px" }}>
                        {(["SOLO", "TEAM"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setCollabType(t)} style={{
                                padding: "7px 16px", borderRadius: "7px", fontSize: "13px",
                                border: `0.5px solid ${collaborationType === t ? "var(--accent)" : "var(--border)"}`,
                                background: collaborationType === t ? "var(--surface2)" : "transparent",
                                color: collaborationType === t ? "var(--text)" : "var(--muted)",
                                cursor: "pointer", transition: "all 0.15s",
                            }}>
                                {t === "SOLO" ? "Solo project" : "Team project"}
                            </button>
                        ))}
                    </div>
                    {collaborationType === "TEAM" && (
                        <Field label="Max team size *">
                            <select title="Maximum team size" value={maxMembers}
                                onChange={e => setMaxMembers(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
                                {["2", "3", "4", "5", "6", "8", "10"].map(n => (
                                    <option key={n} value={n}>{n} people</option>
                                ))}
                            </select>
                        </Field>
                    )}
                </Section>

                {/* ── OPEN ROLES ── */}
                {collaborationType === "TEAM" && (
                    <Section title="Open roles" subtitle="Who are you looking for?">
                        {openRoles.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {openRoles.map(r => (
                                    <span key={r} style={{
                                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                                        background: "var(--surface2)", border: "0.5px solid var(--accent)",
                                        color: "var(--text)", display: "flex", alignItems: "center", gap: "6px",
                                    }}>
                                        {r}
                                        <button type="button" onClick={() => removeRole(r)} style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--muted)", fontSize: "14px", lineHeight: 1, padding: 0,
                                        }}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input type="text" value={roleInput}
                                placeholder="Type a role and press Enter…"
                                onChange={e => setRoleInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRole(roleInput); } }}
                                style={{ ...inputStyle, flex: 1 }} {...focusHandlers}
                            />
                            <button type="button" onClick={() => addRole(roleInput)} style={{
                                padding: "9px 14px", borderRadius: "8px", fontSize: "12px",
                                border: "0.5px solid var(--border)", background: "transparent",
                                color: "var(--muted)", cursor: "pointer",
                            }}>Add</button>
                        </div>
                        <div>
                            <p style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                                Suggestions
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {ROLE_SUGGESTIONS.filter(r => !openRoles.includes(r)).map(r => (
                                    <button key={r} type="button" onClick={() => addRole(r)} style={{
                                        padding: "4px 10px", borderRadius: "6px", fontSize: "11px",
                                        border: "0.5px solid var(--border)", background: "transparent",
                                        color: "var(--muted)", cursor: "pointer", transition: "all 0.12s",
                                    }} className="card-hover">+ {r}</button>
                                ))}
                            </div>
                        </div>
                        <Field label="Contributor expectations" hint="skills, time commitment, timezone">
                            <textarea rows={2} value={contributorExp}
                                placeholder="e.g. 10hrs/week, comfortable with async collaboration, TypeScript required"
                                onChange={e => setContributorExp(e.target.value)}
                                style={{ ...inputStyle, resize: "vertical" }} {...focusHandlers}
                            />
                        </Field>
                    </Section>
                )}

                {/* ── TECH STACK ── */}
                <Section title="Tech stack *">
                    <input type="text"
                        placeholder="Search technologies, frameworks, libraries…"
                        value={techSearch}
                        onChange={e => setTechSearch(e.target.value)}
                        style={inputStyle} {...focusHandlers}
                    />
                    {techStack.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {techStack.map(t => (
                                <span key={t} style={{
                                    padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                                    background: "var(--surface2)", border: "0.5px solid var(--accent)",
                                    color: "var(--text)", display: "flex", alignItems: "center", gap: "6px",
                                }}>
                                    {t}
                                    <button type="button" onClick={() => toggleTech(t)} style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--muted)", fontSize: "14px", lineHeight: 1, padding: 0,
                                    }}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                        {filteredTech.map(tech => (
                            <button key={tech} type="button" onClick={() => toggleTech(tech)} style={{
                                padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                                border: "0.5px solid var(--border)", background: "transparent",
                                color: "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                            }} className="card-hover">{tech}</button>
                        ))}
                    </div>
                </Section>

                {/* ── LINKS ── */}
                <Section title="Links">
                    <Field label="Live project URL" hint="must be reachable">
                        <input type="url" value={liveUrl}
                            placeholder="https://myproject.vercel.app"
                            onChange={e => setLiveUrl(e.target.value)}
                            style={inputStyle} {...focusHandlers}
                        />
                    </Field>
                    <Field label="Repository URL">
                        <input type="url" value={repoUrl}
                            placeholder="https://github.com/username/repo"
                            onChange={e => setRepoUrl(e.target.value)}
                            style={inputStyle} {...focusHandlers}
                        />
                    </Field>
                </Section>

                {/* ── COMMUNITY ── */}
                <Section title="Project community">
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input type="checkbox" checked={createCommunity}
                            onChange={e => setCreateCommunity(e.target.checked)}
                            style={{ flexShrink: 0 }}
                        />
                        <div>
                            <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "2px" }}>
                                Create a community group for this project
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                                A dedicated chat for your team to collaborate and discuss.
                            </p>
                        </div>
                    </label>
                    {createCommunity && (
                        <Field label="Community name">
                            <input type="text"
                                value={communityName || title}
                                onChange={e => setCommunityName(e.target.value)}
                                placeholder="Name for the community group"
                                style={inputStyle} {...focusHandlers}
                            />
                        </Field>
                    )}
                </Section>

                {error && (
                    <p style={{
                        fontSize: "12px", color: "#e24b4a", margin: 0,
                        padding: "10px 14px", borderRadius: "8px",
                        border: "0.5px solid #e24b4a",
                    }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingBottom: 32 }}>
                    <button type="button" onClick={() => router.push("/projects")} style={{
                        padding: "9px 18px", borderRadius: "8px", fontSize: "13px",
                        border: "0.5px solid var(--border)", background: "transparent",
                        color: "var(--muted)", cursor: "pointer",
                    }}>Cancel</button>
                    <button type="submit" disabled={state === "loading"} style={{
                        padding: "9px 22px", borderRadius: "8px", fontSize: "13px",
                        fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                        border: "none",
                        cursor: state === "loading" ? "not-allowed" : "pointer",
                        opacity: state === "loading" ? 0.6 : 1,
                    }}>
                        {state === "loading" ? "Creating…" : "Create project"}
                    </button>
                </div>
            </form>
        </div>
    );
}