"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const TECH_OPTIONS = [
    "Next.js", "React", "TypeScript", "JavaScript", "Node.js",
    "Python", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
    "GraphQL", "REST APIs", "Tailwind CSS", "Prisma", "Redis",
    "Go", "Rust", "Vue.js", "Angular", "Svelte",
    "AWS", "Vercel", "Supabase", "Firebase", "Linux",
    "Git", "GitHub Actions", "Testing", "WebSockets", "Machine Learning",
];

const TOPICS = [
    "Web Development", "Backend", "Frontend", "DevOps", "Open Source",
    "Authentication", "Databases", "Real-time", "Mobile", "AI/ML",
];

interface Props {
    user: { id: string; name: string | null; email: string; role: string };
}

export default function SettingsClient({ user }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"notifications" | "account">("notifications");
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

    async function deleteAccount() {
        if (deleteConfirm !== user.email) { setDeleteError("Email doesn't match."); return; }
        setDeleting(true);
        const res = await fetch("/api/settings/delete-account", { method: "DELETE" });
        if (res.ok) {
            await signOut({ callbackUrl: "/" });
        } else {
            setDeleteError("Failed to delete account."); setDeleting(false);
        }
    }

    const sectionStyle = {
        border: "0.5px solid var(--border)", borderRadius: "11px",
        background: "var(--surface)", overflow: "hidden", marginBottom: "1rem",
    };

    const headerStyle = {
        padding: "0.875rem 1.375rem", borderBottom: "0.5px solid var(--border)",
    };

    return (
        <div style={{ maxWidth: "680px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "2rem" }}>Settings</h1>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem" }}>
                {(["notifications", "account"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: "7px 16px", borderRadius: "7px", fontSize: "13px",
                        border: `0.5px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}`,
                        background: activeTab === tab ? "var(--surface2)" : "transparent",
                        color: activeTab === tab ? "var(--text)" : "var(--muted)",
                        cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                    }}>{tab}</button>
                ))}
            </div>

            {activeTab === "notifications" && (
                <>
                    {/* Tech preferences */}
                    <div style={sectionStyle}>
                        <div style={headerStyle}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                                Preferred technologies
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                                Get notified about projects and content using these technologies.
                            </p>
                        </div>
                        <div style={{ padding: "1.25rem 1.375rem" }}>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Search technologies..."
                                value={techSearch}
                                onChange={e => setTechSearch(e.target.value)}
                                style={{ marginBottom: "12px" }}
                            />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                                {filteredTechs.map(tech => (
                                    <button key={tech} onClick={() => toggleTech(tech)} style={{
                                        padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                                        border: `0.5px solid ${prefTechs.includes(tech) ? "var(--accent)" : "var(--border)"}`,
                                        background: prefTechs.includes(tech) ? "var(--surface2)" : "transparent",
                                        color: prefTechs.includes(tech) ? "var(--text)" : "var(--muted)",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}>{tech}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Topic preferences */}
                    <div style={sectionStyle}>
                        <div style={headerStyle}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Preferred topics</p>
                            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                                We&apos;ll prioritise content and projects in these areas.
                            </p>
                        </div>
                        <div style={{ padding: "1.25rem 1.375rem", display: "flex", flexWrap: "wrap", gap: "7px" }}>
                            {TOPICS.map(topic => (
                                <button key={topic} onClick={() => toggleTopic(topic)} style={{
                                    padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                                    border: `0.5px solid ${prefTopics.includes(topic) ? "var(--accent)" : "var(--border)"}`,
                                    background: prefTopics.includes(topic) ? "var(--surface2)" : "transparent",
                                    color: prefTopics.includes(topic) ? "var(--text)" : "var(--muted)",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>{topic}</button>
                            ))}
                        </div>
                    </div>

                    <button onClick={savePreferences} disabled={saving} style={{
                        padding: "9px 22px", borderRadius: "8px", fontSize: "13px",
                        fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                        border: "none", cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1, transition: "opacity 0.15s",
                        marginBottom: "2rem",
                    }}>
                        {saved ? "Saved ✓" : saving ? "Saving..." : "Save preferences"}
                    </button>
                </>
            )}

            {activeTab === "account" && (
                <>
                    {/* Account info */}
                    <div style={sectionStyle}>
                        <div style={headerStyle}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Account info</p>
                        </div>
                        <div style={{ padding: "1.25rem 1.375rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                { label: "Name", value: user.name ?? "—" },
                                { label: "Email", value: user.email },
                                { label: "Role", value: user.role },
                            ].map(f => (
                                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid var(--border)" }}>
                                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>{f.label}</span>
                                    <span style={{ fontSize: "13px", color: "var(--text)" }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div style={{ ...sectionStyle, border: "0.5px solid #e24b4a33" }}>
                        <div style={{ ...headerStyle, borderBottom: "0.5px solid #e24b4a33" }}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e24b4a" }}>Danger zone</p>
                        </div>
                        <div style={{ padding: "1.25rem 1.375rem" }}>
                            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                                Permanently delete your account and all associated data. This cannot be undone.
                            </p>
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                    Type your email to confirm: <strong style={{ color: "var(--text)" }}>{user.email}</strong>
                                </label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder={user.email}
                                    style={{ borderColor: deleteConfirm && deleteConfirm !== user.email ? "#e24b4a" : undefined }}
                                />
                            </div>
                            {deleteError && (
                                <p style={{ fontSize: "12px", color: "#e24b4a", marginBottom: "10px" }}>{deleteError}</p>
                            )}
                            <button
                                onClick={deleteAccount}
                                disabled={deleting || deleteConfirm !== user.email}
                                style={{
                                    padding: "9px 20px", borderRadius: "8px", fontSize: "13px",
                                    fontWeight: 500, background: "#e24b4a", color: "#fff",
                                    border: "none",
                                    cursor: (deleting || deleteConfirm !== user.email) ? "not-allowed" : "pointer",
                                    opacity: (deleting || deleteConfirm !== user.email) ? 0.5 : 1,
                                }}
                            >
                                {deleting ? "Deleting..." : "Delete my account"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}