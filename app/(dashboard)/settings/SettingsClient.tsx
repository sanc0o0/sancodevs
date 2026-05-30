"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import FriendsTab from "./FriendsTab";
import BlockedUsersTab from "./BlockedUsersTab";

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

const TOPICS = [
    "Web Development", "Backend", "Frontend", "DevOps", "Open Source",
    "Authentication", "Databases", "Real-time", "Mobile", "AI/ML",
];

type Tab = "preferences" | "account" | "friends" | "privacy" | "profile";

interface Props {
    user: { id: string; name: string | null; email: string; role: string };
}

// ─── Shared section wrapper ────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div style={{
            border: "0.5px solid var(--border)", borderRadius: 10,
            background: "var(--surface)", overflow: "hidden", marginBottom: 12,
        }}>
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>{title}</p>
                {subtitle && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{subtitle}</p>}
            </div>
            <div style={{ padding: "16px 20px" }}>
                {children}
            </div>
        </div>
    );
}

function ComingSoon({ label }: { label: string }) {
    return (
        <div style={{ padding: "12px 14px", borderRadius: 8, border: "0.5px dashed var(--border)", background: "var(--surface2)" }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                Coming soon — {label}
            </p>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function SettingsClient({ user }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("preferences");
    const [prefTechs, setPrefTechs] = useState<string[]>([]);
    const [prefTopics, setPrefTopics] = useState<string[]>([]);
    const [techSearch, setTechSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const filteredTechs = TECH_OPTIONS.filter(t =>
        t.toLowerCase().includes(techSearch.toLowerCase())
    );

    function toggleTech(tech: string) {
        setPrefTechs(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    }

    function toggleTopic(topic: string) {
        setPrefTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
    }

    async function savePreferences() {
        setSaving(true);
        await fetch("/api/settings/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefTechs, prefTopics }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    useEffect(() => {
        fetch("/api/settings/notifications")
            .then(r => r.json())
            .then(d => {
                setPrefTechs(d.prefTechs ?? []);
                setPrefTopics(d.prefTopics ?? []);
            })
            .catch(() => { });
    }, []);

    async function deleteAccount() {
        if (deleteConfirm !== user.email) { setDeleteError("Email doesn't match."); return; }
        setDeleting(true);
        const res = await fetch("/api/settings/delete-account", { method: "DELETE" });
        if (res.ok) {
            await signOut({ callbackUrl: "/" });
        } else {
            setDeleteError("Failed to delete account.");
            setDeleting(false);
        }
    }

    const TABS: { id: Tab; label: string }[] = [
        { id: "preferences", label: "Preferences" },
        { id: "account", label: "Account" },
        { id: "friends", label: "Friends" },
        { id: "privacy", label: "Privacy" },
        { id: "profile", label: "Profile" },
    ];

    return (
        <div style={{ maxWidth: 680, padding: "28px 24px" }}>

            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ width: 24, height: 2, background: "var(--accent)", marginBottom: 10 }} />
                <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text)", margin: 0 }}>Settings</h1>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "6px 16px", borderRadius: 7, fontSize: 12,
                            border: `0.5px solid ${activeTab === tab.id ? "var(--accent)" : "var(--border)"}`,
                            background: activeTab === tab.id ? "var(--surface2)" : "transparent",
                            color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── PREFERENCES TAB ── */}
            {activeTab === "preferences" && (
                <>
                    <Section title="Preferred technologies" subtitle="Get matched with projects using these technologies.">
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Search technologies..."
                            value={techSearch}
                            onChange={e => setTechSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {filteredTechs.map(tech => (
                                <button key={tech} onClick={() => toggleTech(tech)} style={{
                                    padding: "4px 11px", borderRadius: 6, fontSize: 11,
                                    border: `0.5px solid ${prefTechs.includes(tech) ? "var(--accent)" : "var(--border)"}`,
                                    background: prefTechs.includes(tech) ? "var(--surface2)" : "transparent",
                                    color: prefTechs.includes(tech) ? "var(--text)" : "var(--muted)",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </Section>

                    <Section title="Preferred topics" subtitle="We'll prioritise content and projects in these areas.">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {TOPICS.map(topic => (
                                <button key={topic} onClick={() => toggleTopic(topic)} style={{
                                    padding: "4px 11px", borderRadius: 6, fontSize: 11,
                                    border: `0.5px solid ${prefTopics.includes(topic) ? "var(--accent)" : "var(--border)"}`,
                                    background: prefTopics.includes(topic) ? "var(--surface2)" : "transparent",
                                    color: prefTopics.includes(topic) ? "var(--text)" : "var(--muted)",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </Section>

                    <button onClick={savePreferences} disabled={saving} style={{
                        padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        background: "var(--accent)", color: "var(--bg)",
                        border: "none", cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1, transition: "opacity 0.15s", marginBottom: 4,
                    }}>
                        {saved ? "Saved ✓" : saving ? "Saving..." : "Save preferences"}
                    </button>
                </>
            )}

            {/* ── ACCOUNT TAB ── */}
            {activeTab === "account" && (
                <>
                    <Section title="Account info">
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            {[
                                { label: "Name", value: user.name ?? "—" },
                                { label: "Email", value: user.email },
                                { label: "Role", value: user.role },
                            ].map((f, i, arr) => (
                                <div key={f.label} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 0",
                                    borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                                }}>
                                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{f.label}</span>
                                    <span style={{ fontSize: 12, color: "var(--text)" }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Upcoming: edit name, change password, connected accounts */}
                    <Section title="Upcoming" subtitle="These features are in development.">
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <ComingSoon label="edit name · change password · connected accounts · 2FA" />
                            <ComingSoon label="notification preferences · email digest settings" />
                        </div>
                    </Section>

                    {/* Danger zone */}
                    <div style={{
                        border: "0.5px solid rgba(226,75,74,0.25)", borderRadius: 10,
                        background: "var(--surface)", overflow: "hidden",
                    }}>
                        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid rgba(226,75,74,0.2)" }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "#e24b4a", margin: 0 }}>Danger zone</p>
                        </div>
                        <div style={{ padding: "16px 20px" }}>
                            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
                                Permanently delete your account and all associated data. This cannot be undone.
                            </p>
                            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                                Type your email to confirm:{" "}
                                <strong style={{ color: "var(--text)" }}>{user.email}</strong>
                            </label>
                            <input
                                className="form-input"
                                type="email"
                                value={deleteConfirm}
                                onChange={e => setDeleteConfirm(e.target.value)}
                                placeholder={user.email}
                                style={{
                                    marginBottom: 10,
                                    borderColor: deleteConfirm && deleteConfirm !== user.email ? "#e24b4a" : undefined,
                                }}
                            />
                            {deleteError && (
                                <p style={{ fontSize: 11, color: "#e24b4a", marginBottom: 10 }}>{deleteError}</p>
                            )}
                            <button
                                onClick={deleteAccount}
                                disabled={deleting || deleteConfirm !== user.email}
                                style={{
                                    padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                    background: "#e24b4a", color: "#fff", border: "none",
                                    cursor: (deleting || deleteConfirm !== user.email) ? "not-allowed" : "pointer",
                                    opacity: (deleting || deleteConfirm !== user.email) ? 0.45 : 1,
                                }}
                            >
                                {deleting ? "Deleting..." : "Delete my account"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── FRIENDS TAB ── */}
            {activeTab === "friends" && (
                <Section title="Friends" subtitle="Manage your connections on Sancodevs.">
                    <FriendsTab />
                </Section>
            )}

            {/* ── PRIVACY TAB ── */}
            {activeTab === "privacy" && (
                <>
                    <Section title="Blocked users" subtitle="Blocked users cannot message you, send requests, or view your profile.">
                        <BlockedUsersTab />
                    </Section>
                    <Section title="Upcoming privacy controls">
                        <ComingSoon label="profile visibility · who can message you · activity status" />
                    </Section>
                </>
            )}

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
                <>
                    <Section title="Builder identity" subtitle="Update how you appear across Sancodevs.">
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>Bio</label>
                                <ComingSoon label="short bio · headline" />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>Mission & availability</label>
                                <ComingSoon label="edit mission · availability · open-to preferences" />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>Domain & role</label>
                                <ComingSoon label="update domain · role · experience level" />
                            </div>
                        </div>
                    </Section>

                    <Section title="Links" subtitle="Connect your presence outside Sancodevs.">
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {["GitHub", "LinkedIn", "Portfolio", "Twitter / X"].map(l => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 12, color: "var(--muted)", width: 90, flexShrink: 0 }}>{l}</span>
                                    <input
                                        className="form-input"
                                        type="url"
                                        placeholder={`https://`}
                                        disabled
                                        style={{ opacity: 0.4, cursor: "not-allowed" }}
                                    />
                                </div>
                            ))}
                            <ComingSoon label="link saving coming soon" />
                        </div>
                    </Section>

                    <Section title="Tech stack" subtitle="Tools and technologies you work with.">
                        <ComingSoon label="custom stack tags · tools · frameworks" />
                    </Section>

                    <Section title="Onboarding answers">
                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>
                            Your onboarding answers shape your project matches. You can redo them at any time.
                        </p>
                        <a href="/onboarding" style={{
                            display: "inline-block", padding: "7px 16px", borderRadius: 8, fontSize: 12,
                            border: "0.5px solid var(--border)", color: "var(--muted)",
                            textDecoration: "none", transition: "color 0.15s, border-color 0.15s",
                        }} className="link-hover">
                            Redo onboarding →
                        </a>
                    </Section>
                </>
            )}

        </div>
    );
}