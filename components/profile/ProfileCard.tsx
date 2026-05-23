"use client";

// components/profile/ProfileCard.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import NextImage from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project { id: string; title: string; status: string; role: string; }

export interface ProfileCardProps {
    name: string;
    username: string;
    email: string;
    image: string | null;
    bannerImage: string | null;
    bio: string | null;
    role: string | null;
    domain: string | null;
    experienceLevel: string | null;
    availability: string | null;
    mission: string | null;
    location?: string | null;
    timezone?: string | null;
    prefTechs: string[];
    prefTopics: string[];
    projects: Project[];
    reliabilityScore: number | null;
    builderScore: number;
    isOwner?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e", IN_PROGRESS: "#378ADD", PAUSED: "#facc15",
    CLOSED: "#666", COMPLETED: "#86efac", TERMINATED: "#e24b4a", ARCHIVED: "#666",
};

const DEFAULT_BANNER = "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)";

const TECH_OPTIONS = [
    "React", "Next.js", "TypeScript", "Node.js", "Python", "PostgreSQL",
    "MongoDB", "Prisma", "Tailwind CSS", "Docker", "GraphQL", "Figma",
    "Three.js", "Go", "Rust", "Swift", "Kotlin", "Flutter", "AWS", "Supabase",
    "Firebase", "Redis", "Kubernetes", "FastAPI", "Django", "Vue.js",
];

const TOPIC_OPTIONS = [
    "AI / ML", "Web Dev", "Mobile", "Startup", "Open Source",
    "Cybersecurity", "Game Dev", "DevOps", "Data Science", "Blockchain",
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function saveField(field: string, value: unknown): Promise<boolean> {
    try {
        const res = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field, value }),
        });
        return res.ok;
    } catch { return false; }
}

async function uploadImage(file: File, type: "avatar" | "banner"): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    try {
        const res = await fetch("/api/upload/profile-image", { method: "POST", body: form });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        return data.url ?? null;
    } catch (e) {
        console.error("uploadImage:", e);
        return null;
    }
}

// ─── Full-screen image viewer ─────────────────────────────────────────────────

function FullScreenViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handler);
        return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} onClick={e => e.stopPropagation()} style={{ maxWidth: "min(90vw,900px)", maxHeight: "88vh", borderRadius: 12, objectFit: "contain", cursor: "default", display: "block", border: "0.5px solid rgba(255,255,255,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }} />
            <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <p style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(255,255,255,0.35)", pointerEvents: "none", whiteSpace: "nowrap" }}>Press Esc or click to close</p>
        </div>
    );
}

// ─── Crop modal ───────────────────────────────────────────────────────────────

function CropModal({ src, aspect, onSave, onCancel }: { src: string; aspect: number; onSave: (dataUrl: string) => void; onCancel: () => void; }) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [imgLoaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [naturalSize, setNatural] = useState({ w: 0, h: 0 });
    const [displaySize, setDisplay] = useState({ w: 0, h: 0 });
    const [imgOffset, setOffset] = useState({ x: 0, y: 0 });
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const drag = useRef({ active: false, startMx: 0, startMy: 0, startCx: 0, startCy: 0 });
    const resize = useRef({ active: false, startMx: 0, startCw: 0 });

    function clamp(c: typeof crop, dw: number, dh: number) {
        const w = Math.max(40, Math.min(c.w, dw));
        const h = w / aspect;
        const x = Math.max(0, Math.min(c.x, dw - w));
        const y = Math.max(0, Math.min(c.y, dh - h));
        return { x, y, w, h: Math.min(h, dh - y) };
    }

    function init() {
        const img = imgRef.current; const cont = containerRef.current;
        if (!img || !cont) return;
        const ir = img.getBoundingClientRect(); const cr = cont.getBoundingClientRect();
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        setDisplay({ w: ir.width, h: ir.height });
        setOffset({ x: ir.left - cr.left, y: ir.top - cr.top });
        const w = Math.min(ir.width * 0.8, ir.height * aspect * 0.8);
        setCrop({ x: (ir.width - w) / 2, y: (ir.height - w / aspect) / 2, w, h: w / aspect });
        setLoaded(true);
    }

    const onMove = useCallback((e: MouseEvent | TouchEvent) => {
        const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
        const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
        if (drag.current.active) setCrop(p => clamp({ ...p, x: drag.current.startCx + cx - drag.current.startMx, y: drag.current.startCy + cy - drag.current.startMy }, displaySize.w, displaySize.h));
        if (resize.current.active) { const nw = Math.max(40, resize.current.startCw + cx - resize.current.startMx); setCrop(p => clamp({ ...p, w: nw, h: nw / aspect }, displaySize.w, displaySize.h)); }
    }, [displaySize, aspect]);

    const onUp = useCallback(() => { drag.current.active = false; resize.current.active = false; }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onMove as EventListener);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove as EventListener, { passive: true });
        window.addEventListener("touchend", onUp);
        return () => { window.removeEventListener("mousemove", onMove as EventListener); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("touchend", onUp); };
    }, [onMove, onUp]);

    const startDrag = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); const cx = "touches" in e ? e.touches[0].clientX : e.clientX; const cy = "touches" in e ? e.touches[0].clientY : e.clientY; drag.current = { active: true, startMx: cx, startMy: cy, startCx: crop.x, startCy: crop.y }; };
    const startResize = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); const cx = "touches" in e ? e.touches[0].clientX : e.clientX; resize.current = { active: true, startMx: cx, startCw: crop.w }; };

    function handleSave() {
        const img = imgRef.current; const canvas = canvasRef.current;
        if (!img || !canvas || !imgLoaded) return;
        setSaving(true);
        const sx = naturalSize.w / displaySize.w; const sy = naturalSize.h / displaySize.h;
        const ow = aspect === 1 ? 400 : 1200; const oh = aspect === 1 ? 400 : 300;
        canvas.width = ow; canvas.height = oh;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setSaving(false); return; }
        ctx.drawImage(img, crop.x * sx, crop.y * sy, crop.w * sx, crop.h * sy, 0, 0, ow, oh);
        onSave(canvas.toDataURL("image/jpeg", 0.92));
        setSaving(false);
    }

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 12, width: "100%", maxWidth: 560, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>Crop {aspect === 1 ? "profile picture" : "banner"}</p>
                    <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
                </div>
                <div ref={containerRef} style={{ position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, maxHeight: "60vh", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img ref={imgRef} src={src} alt="" onLoad={() => requestAnimationFrame(() => requestAnimationFrame(init))} draggable={false} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block", opacity: 0.35, userSelect: "none", pointerEvents: "none" }} />
                    {imgLoaded && (
                        <div onMouseDown={startDrag} onTouchStart={startDrag} style={{ position: "absolute", left: imgOffset.x + crop.x, top: imgOffset.y + crop.y, width: crop.w, height: crop.h, border: "2px solid var(--accent)", borderRadius: aspect === 1 ? "50%" : 6, boxSizing: "border-box", cursor: "grab", overflow: "hidden" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" draggable={false} style={{ position: "absolute", left: -crop.x, top: -crop.y, width: displaySize.w, height: displaySize.h, maxWidth: "none", pointerEvents: "none", userSelect: "none" }} />
                            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                                {[33.3, 66.6].map(v => <g key={v}><line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" /><line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" /></g>)}
                            </svg>
                            <div onMouseDown={startResize} onTouchStart={startResize} style={{ position: "absolute", bottom: -10, right: -10, width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg)", cursor: "nwse-resize", zIndex: 5 }} />
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div style={{ padding: "13px 18px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, border: "0.5px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleSave} disabled={!imgLoaded || saving} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, background: "var(--accent)", color: "var(--bg)", border: "none", cursor: !imgLoaded || saving ? "not-allowed" : "pointer", opacity: !imgLoaded || saving ? 0.5 : 1 }}>
                        {saving ? "Saving…" : "Save crop"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit profile modal ───────────────────────────────────────────────────────

interface EditModalProps {
    initial: { name: string; bio: string; techs: string[]; topics: string[] };
    onSaved: (updated: { name: string; bio: string; techs: string[]; topics: string[] }) => void;
    onClose: () => void;
}

function EditProfileModal({ initial, onSaved, onClose }: EditModalProps) {
    const [name, setName] = useState(initial.name);
    const [bio, setBio] = useState(initial.bio);
    const [techs, setTechs] = useState<string[]>(initial.techs);
    const [topics, setTopics] = useState<string[]>(initial.topics);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Scroll lock + Esc
    useEffect(() => {
        document.body.style.overflow = "hidden";
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
    }, [onClose]);

    const toggleTech = (t: string) => setTechs(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
    const toggleTopic = (t: string) => setTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

    // Validate
    function validate(): string | null {
        if (!name.trim()) return "Display name cannot be empty.";
        if (name.trim().length > 50) return "Display name must be under 50 characters.";
        if (bio.length > 280) return "Bio must be under 280 characters.";
        return null;
    }

    async function handleSave() {
        const err = validate();
        if (err) { setError(err); return; }

        setSaving(true); setError("");

        // Save all fields in parallel
        const results = await Promise.all([
            saveField("name", name.trim()),
            saveField("bio", bio.trim()),
            saveField("prefTechs", techs),
            saveField("prefTopics", topics),
        ]);

        setSaving(false);

        if (results.some(r => !r)) {
            setError("Some changes failed to save. Please try again.");
            return;
        }

        // All saved — update parent state (no page reload needed)
        onSaved({ name: name.trim(), bio: bio.trim(), techs, topics });
        onClose();
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "0.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: 13, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s",
    };

    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 9999, top: "64px", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`}</style>

            <div style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.65)", animation: "modalIn 0.18s ease" }}>

                {/* Header */}
                <div style={{ padding: "15px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Edit profile</p>
                        <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Changes are saved to your account</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* Display name */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                            Display name <span style={{ color: "#e24b4a" }}>*</span>
                        </label>
                        <input
                            type="text" value={name} maxLength={50}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your name"
                            style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        />
                        <p style={{ fontSize: 10, color: "var(--muted)", margin: "4px 0 0", textAlign: "right" }}>{name.length}/50</p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                            Bio <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 400, textTransform: "none" }}>optional</span>
                        </label>
                        <textarea
                            value={bio} maxLength={280} rows={3}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Tell others what you're building or who you are…"
                            style={{ ...inputStyle, resize: "none" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        />
                        <p style={{ fontSize: 10, color: bio.length > 250 ? "#fb923c" : "var(--muted)", margin: "4px 0 0", textAlign: "right" }}>{bio.length}/280</p>
                    </div>

                    {/* Tech stack */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tech stack</label>
                            {techs.length > 0 && (
                                <button onClick={() => setTechs([])} style={{ fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear all</button>
                            )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {TECH_OPTIONS.map(opt => (
                                <button key={opt} type="button" onClick={() => toggleTech(opt)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all 0.12s", border: `0.5px solid ${techs.includes(opt) ? "var(--accent)" : "var(--border)"}`, background: techs.includes(opt) ? "rgba(55,138,221,0.12)" : "transparent", color: techs.includes(opt) ? "var(--text)" : "var(--muted)", fontWeight: techs.includes(opt) ? 500 : 400 }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Interests</label>
                            {topics.length > 0 && (
                                <button onClick={() => setTopics([])} style={{ fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear all</button>
                            )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {TOPIC_OPTIONS.map(opt => (
                                <button key={opt} type="button" onClick={() => toggleTopic(opt)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all 0.12s", border: `0.5px solid ${topics.includes(opt) ? "var(--accent)" : "var(--border)"}`, background: topics.includes(opt) ? "rgba(55,138,221,0.12)" : "transparent", color: topics.includes(opt) ? "var(--text)" : "var(--muted)", fontWeight: topics.includes(opt) ? 500 : 400 }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "9px 12px", borderRadius: 8, background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.3)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <p style={{ fontSize: 12, color: "#e24b4a", margin: 0, lineHeight: 1.5 }}>{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "13px 18px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, border: "0.5px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                        Discard
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "var(--accent)", color: "var(--bg)", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {saving
                            ? <><Spinner /> Saving…</>
                            : <><CheckIcon /> Save changes</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Upload spinner ───────────────────────────────────────────────────────────

function Spinner({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    );
}

function CheckIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function CameraIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
}

function PencilIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

// ─── Tag row (read-only) ──────────────────────────────────────────────────────

function TagRow({ tags, empty }: { tags: string[]; empty: string }) {
    if (tags.length === 0) return <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>{empty}</p>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map(t => (
                <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "0.5px solid var(--border)", color: "var(--muted)", background: "var(--surface2)" }}>{t}</span>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileCard({
    name, username, image, bannerImage, bio,
    role, domain, experienceLevel, availability,
    prefTechs, prefTopics, projects, reliabilityScore, builderScore,
    isOwner = false,
}: ProfileCardProps) {
    // Local state — updated client-side after DB save, no page reload needed
    const [avatarSrc, setAvatarSrc] = useState<string | null>(image);
    const [bannerSrc, setBannerSrc] = useState<string | null>(bannerImage);
    const [localName, setLocalName] = useState(name);
    const [localBio, setLocalBio] = useState(bio ?? "");
    const [localTechs, setLocalTechs] = useState<string[]>(prefTechs);
    const [localTopics, setLocalTopics] = useState<string[]>(prefTopics);

    // UI state
    const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
    const [cropState, setCropState] = useState<{ src: string; aspect: number; target: "avatar" | "banner" } | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [uploadAvatar, setUpAvatar] = useState(false);
    const [uploadBanner, setUpBanner] = useState(false);
    const [uploadError, setUpError] = useState("");
    const [showAll, setShowAll] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const expLabel = experienceLevel
        ? ({ BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as Record<string, string>)[experienceLevel] ?? experienceLevel
        : null;

    // ── File selection → validate → open crop modal ───────────────────────────
    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setUpError("Please select an image file (JPEG, PNG, WebP, GIF)."); return; }
        if (file.size > 10 * 1024 * 1024) { setUpError("Image must be under 10 MB."); return; }
        setUpError("");
        const reader = new FileReader();
        reader.onload = ev => setCropState({ src: ev.target?.result as string, aspect: target === "avatar" ? 1 : 4, target });
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    // ── Crop done → upload → save URL to DB → update local state ─────────────
    async function onCropSave(dataUrl: string) {
        if (!cropState) return;
        const target = cropState.target;
        setCropState(null);
        setUpError("");

        const blob = await fetch(dataUrl).then(r => r.blob());
        const file = new File([blob], `${target}.jpg`, { type: "image/jpeg" });

        if (target === "avatar") {
            setAvatarSrc(dataUrl); // optimistic
            setUpAvatar(true);
            const url = await uploadImage(file, "avatar");
            setUpAvatar(false);
            if (url) {
                const ok = await saveField("image", url);
                setAvatarSrc(url); // confirmed URL
                if (!ok) setUpError("Photo uploaded but failed to save. Try reloading.");
            } else {
                setAvatarSrc(image); // revert
                setUpError("Upload failed. Please try again.");
            }
        } else {
            setBannerSrc(dataUrl);
            setUpBanner(true);
            const url = await uploadImage(file, "banner");
            setUpBanner(false);
            if (url) {
                const ok = await saveField("bannerImage", url);
                setBannerSrc(url);
                if (!ok) setUpError("Banner uploaded but failed to save. Try reloading.");
            } else {
                setBannerSrc(bannerImage);
                setUpError("Banner upload failed. Please try again.");
            }
        }
    }

    // ── Edit modal saved → update all local state ─────────────────────────────
    function onEditSaved(updated: { name: string; bio: string; techs: string[]; topics: string[] }) {
        setLocalName(updated.name);
        setLocalBio(updated.bio);
        setLocalTechs(updated.techs);
        setLocalTopics(updated.topics);
    }

    const displayedProjects = showAll ? projects : projects.slice(0, 3);

    return (
        <>
            {/* Hidden file inputs */}
            {isOwner && (
                <>
                    <input title="Profile Picture" ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onFileSelected(e, "avatar")} />
                    <input title="Banner" ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onFileSelected(e, "banner")} />
                </>
            )}

            {/* Modals */}
            {viewer && <FullScreenViewer src={viewer.src} alt={viewer.alt} onClose={() => setViewer(null)} />}
            {cropState && <CropModal src={cropState.src} aspect={cropState.aspect} onSave={onCropSave} onCancel={() => setCropState(null)} />}
            {editOpen && isOwner && (
                <EditProfileModal
                    initial={{ name: localName, bio: localBio, techs: localTechs, topics: localTopics }}
                    onSaved={onEditSaved}
                    onClose={() => setEditOpen(false)}
                />
            )}

            <style>{`
                .pc-banner:hover .pc-banner-ov { opacity: 1 !important; }
                .pc-av:hover .pc-av-ov { opacity: 1 !important; }
                .card-hover:hover { border-color: var(--accent) !important; }
            `}</style>

            <div style={{ width: "100%", borderRadius: 12, border: "0.5px solid var(--border)", background: "var(--surface)", overflow: "visible", position: "relative" }}>

                {/* ── Banner ── */}
                <div
                    className="pc-banner"
                    onClick={() => {
                        if (isOwner) bannerInputRef.current?.click();
                        else if (bannerSrc) setViewer({ src: bannerSrc, alt: "Banner" });
                    }}
                    style={{ position: "relative", height: 84, cursor: isOwner ? "pointer" : (bannerSrc ? "zoom-in" : "default"), background: bannerSrc ? undefined : DEFAULT_BANNER, overflow: "hidden", borderRadius: "12px 12px 0 0" }}
                >
                    {bannerSrc && <NextImage src={bannerSrc} alt="Banner" fill style={{ objectFit: "cover" }} sizes="320px" priority />}

                    {uploadBanner && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Spinner size={22} />
                        </div>
                    )}

                    <div className="pc-banner-ov" style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.15s", background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        {isOwner ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#fff", padding: "4px 12px", borderRadius: 20, background: "rgba(0,0,0,0.55)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                                <CameraIcon /> Edit banner
                            </span>
                        ) : (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>View full size</span>
                        )}
                    </div>

                    {/* Builder badge */}
                    <div style={{ position: "absolute", top: 8, right: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "0.5px solid rgba(255,255,255,0.15)", zIndex: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span style={{ fontSize: 9, color: "#93c5fd", fontWeight: 500 }}>Builder</span>
                    </div>
                </div>

                {/* ── Avatar ── */}
                <div style={{ position: "relative", zIndex: 10, height: 0, overflow: "visible", paddingLeft: 16 }}>
                    <div
                        className="pc-av"
                        onClick={() => {
                            if (isOwner) avatarInputRef.current?.click();
                            else if (avatarSrc) setViewer({ src: avatarSrc, alt: localName });
                        }}
                        style={{ position: "absolute", top: -28, left: 16, width: 56, height: 56, borderRadius: "50%", border: "2.5px solid var(--surface)", background: "var(--surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: isOwner ? "pointer" : (avatarSrc ? "zoom-in" : "default"), zIndex: 10 }}
                    >
                        {avatarSrc
                            ? <NextImage src={avatarSrc} alt={localName} width={56} height={56} style={{ objectFit: "cover", borderRadius: "50%", width: "100%", height: "100%" }} />
                            : <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{localName.charAt(0).toUpperCase()}</span>
                        }
                        {uploadAvatar && (
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Spinner size={16} />
                            </div>
                        )}
                        <div className="pc-av-ov" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.52)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", pointerEvents: "none" }}>
                            {isOwner
                                ? <CameraIcon />
                                : avatarSrc ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    : null
                            }
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: "36px 16px 16px" }}>

                    {/* Upload error */}
                    {uploadError && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 8, background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.3)", marginBottom: 12 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <p style={{ fontSize: 11, color: "#e24b4a", margin: 0, flex: 1 }}>{uploadError}</p>
                            <button onClick={() => setUpError("")} style={{ background: "none", border: "none", color: "#e24b4a", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}>✕</button>
                        </div>
                    )}

                    {/* Name row + single pencil button (owner only) */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 2 }}>
                                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>{localName}</h2>
                                {expLabel && (
                                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)" }}>{expLabel}</span>
                                )}
                                {(reliabilityScore ?? 0) >= 90 && (
                                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "0.5px solid rgba(34,197,94,0.2)" }}>{reliabilityScore}% reliable</span>
                                )}
                            </div>
                            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>@{username}</p>
                        </div>

                        {/* Single edit pencil — owner only */}
                        {isOwner && (
                            <button
                                onClick={() => setEditOpen(true)}
                                title="Edit profile"
                                style={{ background: "transparent", border: "0.5px solid var(--border)", cursor: "pointer", padding: "5px 7px", color: "var(--muted)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
                            >
                                <PencilIcon />
                            </button>
                        )}
                    </div>

                    {(role || domain) && (
                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, marginBottom: 0, textTransform: "capitalize" }}>
                            {[role, domain].filter(Boolean).join(" · ")}
                        </p>
                    )}

                    <div style={{ height: "0.5px", background: "var(--border)", margin: "12px 0" }} />

                    {/* Bio + tech + interests — same layout for owner and viewer, owner gets pencil to open modal */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Bio</p>
                            {localBio
                                ? <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{localBio}</p>
                                : <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>{isOwner ? "Add a bio — click the pencil icon above." : "No bio yet."}</p>
                            }
                        </div>
                        <div>
                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Tech stack</p>
                            <TagRow tags={localTechs} empty={isOwner ? "None set — click the pencil to add." : "Not set."} />
                        </div>
                        <div>
                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Interests</p>
                            <TagRow tags={localTopics} empty={isOwner ? "None set — click the pencil to add." : "Not set."} />
                        </div>
                    </div>

                    <div style={{ height: "0.5px", background: "var(--border)", margin: "12px 0" }} />

                    {/* Active projects */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Active projects</p>
                        {projects.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "14px 0" }}>
                                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: isOwner ? 10 : 0 }}>No active projects yet</p>
                                {isOwner && (
                                    <Link href="/projects" style={{ display: "inline-block", padding: "7px 16px", borderRadius: 7, fontSize: 12, background: "var(--accent)", color: "var(--bg)", textDecoration: "none", fontWeight: 500 }}>
                                        Explore projects →
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {displayedProjects.map(p => (
                                    <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                                        <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", transition: "border-color 0.15s" }}>
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[p.status] ?? "var(--muted)", flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                                                <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1, textTransform: "capitalize" }}>{p.role}</p>
                                            </div>
                                            <span style={{ fontSize: 9, fontWeight: 600, color: STATUS_COLORS[p.status] ?? "var(--muted)", textTransform: "uppercase", flexShrink: 0 }}>
                                                {p.status.replace("_", " ")}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                {projects.length > 3 && (
                                    <button onClick={() => setShowAll(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--accent)", padding: "3px 0", textAlign: "left" }}>
                                        {showAll ? "Show less ↑" : `See ${projects.length - 3} more ↓`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ height: "0.5px", background: "var(--border)", margin: "12px 0" }} />

                    {/* Builder score + availability */}
                    <div style={{ display: "flex", gap: 8 }}>
                        {builderScore > 0 && (
                            <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", textAlign: "center" }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", margin: 0 }}>{builderScore}</p>
                                <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Builder score</p>
                            </div>
                        )}
                        {availability && (
                            <div style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Availability</p>
                                <p style={{ fontSize: 11, color: "var(--text)", margin: 0 }}>{availability}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}