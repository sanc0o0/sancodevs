"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


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

const DIFFICULTY = ["Beginner", "Intermediate", "Advanced"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            padding: "1.25rem 1.5rem", borderRadius: "10px",
            border: "0.5px solid var(--border)", background: "var(--surface)",
        }}>
            <p style={{
                fontSize: "11px", color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem",
            }}>{title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

export default function NewProjectPage() {
    const router = useRouter();
    const [state, setState] = useState<"idle" | "loading" | "error">("idle");
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [projectUrl, setProjectUrl] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState(DIFFICULTY[0]);
    const [maxMembers, setMaxMembers] = useState("3");
    const [techStack, setTechStack] = useState<string[]>([]);
    const [lookingFor, setLookingFor] = useState("");
    const [type, setType] = useState<"solo" | "team">("team");
    const [techSearch, setTechSearch] = useState("");
    const [createCommunity, setCreateCommunity] = useState(true);
    const [communityName, setCommunityName] = useState("");
    const filteredTech = TECH_OPTIONS.filter(t =>
        t.toLowerCase().includes(techSearch.toLowerCase())
    );

    // Update useEffect to auto-fill community name from project title:
    useEffect(() => {
        if (createCommunity && title && !communityName) {
            setCommunityName(title);
        }
    }, [title, createCommunity]);

    function toggleTech(tech: string) {
        setTechStack(prev =>
            prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
        );
    }


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (techStack.length === 0) { setError("Select at least one technology."); return; }
        setState("loading");
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, description, difficulty,
                    maxMembers: parseInt(maxMembers),
                    techStack, lookingFor, type,
                    projectUrl, repoUrl,
                    createCommunity,
                    communityName: communityName || title,
                }),
            });
            if (res.ok) router.push("/projects?created=true");
            else { const d = await res.json(); setError(d.error ?? "Something went wrong."); setState("idle"); }
        } catch {
            setError("Failed to create project."); setState("idle");
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: "8px",
        border: "0.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: "13px", outline: "none",
        transition: "border-color 0.15s", boxSizing: "border-box",
        fontFamily: "inherit",
    };

    return (
        <div style={{ maxWidth: "620px" }}>
            <div style={{ width: "24px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                Create a project
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
                Once submitted, your project will be visible to all SancoDevs users. Others can request to join.
                You commit to seeing it through.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Basics */}
                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Basics</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Project title *</label>
                            <input type="text" value={title} required placeholder="e.g. Open-source habit tracker"
                                onChange={e => setTitle(e.target.value)} style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Description *</label>
                            <textarea value={description} required rows={4}
                                placeholder="What are you building? What problem does it solve? What will contributors learn?"
                                onChange={e => setDescription(e.target.value)}
                                style={{ ...inputStyle, resize: "vertical" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                    </div>
                </div>

                {/* Type + difficulty */}
                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Project type</p>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        {(["solo", "team"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setType(t)} style={{
                                padding: "7px 16px", borderRadius: "7px", fontSize: "13px",
                                border: `0.5px solid ${type === t ? "var(--accent)" : "var(--border)"}`,
                                background: type === t ? "var(--surface2)" : "transparent",
                                color: type === t ? "var(--text)" : "var(--muted)",
                                cursor: "pointer", transition: "all 0.15s",
                                textTransform: "capitalize",
                            }}>{t === "solo" ? "Solo project" : "Team project"}</button>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Difficulty *</label>
                            <select 
                                id="difficulty-select"
                                title="Project difficulty"
                                aria-label="Project difficulty"
                                value={difficulty} onChange={e => setDifficulty(e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            >
                                {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        {type === "team" && (
                            <div>
                                <label 
                                    style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Max team size *</label>
                                <select 
                                    id="team-seize-select"
                                    title="Maximum team size"
                                    aria-label="Maximum team size" 
                                    value={maxMembers} onChange={e => setMaxMembers(e.target.value)}
                                    style={{ ...inputStyle, cursor: "pointer" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                >
                                    {["2", "3", "4", "5"].map(n => <option key={n} value={n}>{n} people</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Looking for */}
                {type === "team" && (
                    <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                        <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Looking for</p>
                        <textarea value={lookingFor} rows={3}
                            placeholder="What kind of contributor are you looking for? Skills, commitment level, time zone, etc."
                            onChange={e => setLookingFor(e.target.value)}
                            style={{ ...inputStyle, resize: "vertical" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        />
                    </div>
                )}
                
                {/* Links */}
                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Links</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Project URL (must be live)</label>
                            <input type="url" value={projectUrl}
                                placeholder="https://myproject.vercel.app"
                                onChange={e => setProjectUrl(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Repository URL</label>
                            <input type="url" value={repoUrl}
                                placeholder="https://github.com/username/repo"
                                onChange={e => setRepoUrl(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                    </div>
                </div>

                <Section title="Tech stack *">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Search technologies, frameworks, libraries..."
                        value={techSearch}
                        onChange={e => setTechSearch(e.target.value)}
                        style={{ marginBottom: "10px" }}
                    />
                    {techStack.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                            {techStack.map(t => (
                                <span key={t} style={{
                                    padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                                    background: "var(--surface2)", border: "0.5px solid var(--accent)",
                                    color: "var(--text)", display: "flex", alignItems: "center", gap: "6px",
                                }}>
                                    {t}
                                    <button onClick={() => toggleTech(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "14px", lineHeight: 1, padding: 0 }}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                        {filteredTech.filter(t => !techStack.includes(t)).map(tech => (
                            <button key={tech} onClick={() => toggleTech(tech)} style={{
                                padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                                border: "0.5px solid var(--border)", background: "transparent",
                                color: "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                            }}
                                className="card-hover"
                            >{tech}</button>
                        ))}
                    </div>
                </Section>

                <Section title="Project community">
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={createCommunity}
                            onChange={e => setCreateCommunity(e.target.checked)}
                            style={{ flexShrink: 0 }}
                        />
                        <div>
                            <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "2px" }}>
                                Create a community group for this project
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                                A dedicated chat for the team to collaborate, discuss, and ask questions.
                            </p>
                        </div>
                    </label>
                    {createCommunity && (
                        <div style={{ marginTop: "10px" }}>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                Community name
                            </label>
                            <input
                                className="form-input"
                                type="text"
                                value={communityName || title}
                                onChange={e => setCommunityName(e.target.value)}
                                placeholder="Name for the community group"
                            />
                        </div>
                    )}
                </Section>

                {error && (
                    <p style={{ fontSize: "12px", color: "#e24b4a", padding: "10px 14px", borderRadius: "8px", border: "0.5px solid #e24b4a" }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => router.push("/projects")} style={{
                        padding: "9px 18px", borderRadius: "8px", fontSize: "13px",
                        border: "0.5px solid var(--border)", background: "transparent",
                        color: "var(--muted)", cursor: "pointer",
                    }}>Cancel</button>

                    
                    <button type="submit" disabled={state === "loading"} style={{
                        padding: "9px 22px", borderRadius: "8px", fontSize: "13px",
                        fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                        border: "none", cursor: state === "loading" ? "not-allowed" : "pointer",
                        opacity: state === "loading" ? 0.6 : 1,
                    }}>
                        {state === "loading" ? "Creating..." : "Create project"}
                    </button>
                </div>
            </form>
        </div>
    );
}