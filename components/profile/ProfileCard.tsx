"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import NextImage from "next/image";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Project {
    id: string;
    title: string;
    status: string;
    role: string;
}

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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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

// ─── SAVE HELPER ─────────────────────────────────────────────────────────────

async function saveField(field: string, value: unknown): Promise<boolean> {
    try {
        const res = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field, value }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ─── IMAGE UPLOAD HELPER ──────────────────────────────────────────────────────

async function uploadImage(file: File, type: "avatar" | "banner"): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    try {
        const res = await fetch("/api/upload/profile-image", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) { console.error("Upload error:", data.error); return null; }
        return data.url as string;
    } catch {
        return null;
    }
}

// ─── FULL-SCREEN IMAGE VIEWER ─────────────────────────────────────────────────

function FullScreenViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
        }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} onClick={e => e.stopPropagation()} style={{
                maxWidth: "min(90vw, 900px)", maxHeight: "88vh",
                borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.12)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
                objectFit: "contain", cursor: "default", display: "block",
            }} />
            <button onClick={onClose} style={{
                position: "absolute", top: 20, right: 20,
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
            <p style={{
                position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
                fontSize: 11, color: "rgba(255,255,255,0.3)", pointerEvents: "none", whiteSpace: "nowrap",
            }}>Press Esc or click to close</p>
        </div>
    );
}

// ─── CROP MODAL ───────────────────────────────────────────────────────────────

function CropModal({ src, aspect, onSave, onCancel }: {
    src: string; aspect: number;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [imgLoaded, setImgLoaded] = useState(false);
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

    function measureAndInit() {
        const img = imgRef.current;
        const cont = containerRef.current;
        if (!img || !cont) return;
        const iRect = img.getBoundingClientRect();
        const cRect = cont.getBoundingClientRect();
        const dw = iRect.width;
        const dh = iRect.height;
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        setDisplay({ w: dw, h: dh });
        setOffset({ x: iRect.left - cRect.left, y: iRect.top - cRect.top });
        const w = Math.min(dw * 0.8, dh * aspect * 0.8);
        const h = w / aspect;
        setCrop({ x: (dw - w) / 2, y: (dh - h) / 2, w, h });
        setImgLoaded(true);
    }

    function onImgLoad() {
        requestAnimationFrame(() => requestAnimationFrame(measureAndInit));
    }

    const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
        const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
        const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
        if (drag.current.active) {
            setCrop(prev => clamp({
                ...prev,
                x: drag.current.startCx + cx - drag.current.startMx,
                y: drag.current.startCy + cy - drag.current.startMy,
            }, displaySize.w, displaySize.h));
        }
        if (resize.current.active) {
            const nw = Math.max(40, resize.current.startCw + cx - resize.current.startMx);
            setCrop(prev => clamp({ ...prev, w: nw, h: nw / aspect }, displaySize.w, displaySize.h));
        }
    }, [displaySize, aspect]);

    const onPointerUp = useCallback(() => {
        drag.current.active = false;
        resize.current.active = false;
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onPointerMove as EventListener);
        window.addEventListener("mouseup", onPointerUp);
        window.addEventListener("touchmove", onPointerMove as EventListener, { passive: true });
        window.addEventListener("touchend", onPointerUp);
        return () => {
            window.removeEventListener("mousemove", onPointerMove as EventListener);
            window.removeEventListener("mouseup", onPointerUp);
            window.removeEventListener("touchmove", onPointerMove as EventListener);
            window.removeEventListener("touchend", onPointerUp);
        };
    }, [onPointerMove, onPointerUp]);

    function startDrag(e: React.MouseEvent | React.TouchEvent) {
        e.preventDefault();
        const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
        const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
        drag.current = { active: true, startMx: cx, startMy: cy, startCx: crop.x, startCy: crop.y };
    }

    function startResize(e: React.MouseEvent | React.TouchEvent) {
        e.preventDefault();
        e.stopPropagation();
        const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
        resize.current = { active: true, startMx: cx, startCw: crop.w };
    }

    function handleSave() {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas || !imgLoaded) return;
        setSaving(true);
        const scaleX = naturalSize.w / displaySize.w;
        const scaleY = naturalSize.h / displaySize.h;
        const outW = aspect === 1 ? 400 : 1200;
        const outH = aspect === 1 ? 400 : 300;
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setSaving(false); return; }
        ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, 0, 0, outW, outH);
        onSave(canvas.toDataURL("image/jpeg", 0.92));
        setSaving(false);
    }

    const boxLeft = imgOffset.x + crop.x;
    const boxTop = imgOffset.y + crop.y;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 12, width: "100%", maxWidth: 580, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                        Crop {aspect === 1 ? "profile picture" : "banner"}
                    </p>
                    <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>✕</button>
                </div>

                <div ref={containerRef} style={{ position: "relative", width: "100%", background: "#000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, maxHeight: "62vh" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img ref={imgRef} src={src} alt="Crop source" onLoad={onImgLoad} draggable={false}
                        style={{ maxWidth: "100%", maxHeight: "62vh", display: "block", opacity: 0.38, userSelect: "none", pointerEvents: "none" }}
                    />

                    {imgLoaded && (
                        <div onMouseDown={startDrag} onTouchStart={startDrag} style={{
                            position: "absolute", left: boxLeft, top: boxTop,
                            width: crop.w, height: crop.h,
                            border: "2px solid var(--accent)",
                            borderRadius: aspect === 1 ? "50%" : 6,
                            boxSizing: "border-box", cursor: "grab", overflow: "hidden",
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" draggable={false} style={{
                                position: "absolute", left: -crop.x, top: -crop.y,
                                width: displaySize.w, height: displaySize.h,
                                maxWidth: "none", pointerEvents: "none", userSelect: "none",
                            }} />
                            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                                {[33.3, 66.6].map(v => (
                                    <g key={v}>
                                        <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                        <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    </g>
                                ))}
                            </svg>
                            <div onMouseDown={startResize} onTouchStart={startResize} style={{
                                position: "absolute", bottom: -10, right: -10,
                                width: 20, height: 20, borderRadius: "50%",
                                background: "var(--accent)", border: "2px solid var(--bg)",
                                cursor: "nwse-resize", zIndex: 5,
                            }} />
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} style={{ display: "none" }} />

                <div style={{ padding: "13px 18px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} className="btn-ghost" style={{ fontSize: 12 }}>Cancel</button>
                    <button onClick={handleSave} disabled={!imgLoaded || saving} className="btn-action"
                        style={{ fontSize: 12, opacity: !imgLoaded || saving ? 0.5 : 1 }}>
                        {saving ? "Saving…" : "Save crop"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── EDITABLE TEXT FIELD ──────────────────────────────────────────────────────

function EditableField({ label, value, placeholder, multiline, maxLength, dbField, onSaved }: {
    label: string; value: string; placeholder: string;
    multiline?: boolean; maxLength?: number;
    dbField: string;
    onSaved?: (val: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSave() {
        setSaving(true);
        setError("");
        const ok = await saveField(dbField, val.trim());
        setSaving(false);
        if (!ok) { setError("Save failed — try again."); return; }
        onSaved?.(val.trim());
        setEditing(false);
    }

    const shared: React.CSSProperties = {
        width: "100%", padding: "7px 10px", borderRadius: 7,
        border: "0.5px solid var(--accent)", background: "var(--bg)",
        color: "var(--text)", fontSize: 12, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
    };

    return (
        <div style={{ padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</p>

            {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {multiline ? (
                        <textarea
                            title="Text"
                            autoFocus rows={3} value={val} maxLength={maxLength}
                            onChange={e => setVal(e.target.value)}
                            style={shared}
                        />
                    ) : (
                        <input
                            title="Enter"
                            autoFocus type="text" value={val} maxLength={maxLength}
                            onChange={e => setVal(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setVal(value); } }}
                            style={{ ...shared, resize: undefined }}
                        />
                    )}
                    {maxLength && (
                        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, textAlign: "right" }}>
                            {val.length}/{maxLength}
                        </p>
                    )}
                    {error && <p style={{ fontSize: 11, color: "#e24b4a", margin: 0 }}>{error}</p>}
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleSave} disabled={saving} style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 11,
                            background: "var(--accent)", color: "var(--bg)", border: "none",
                            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                        }}>
                            {saving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => { setEditing(false); setVal(value); }} style={{
                            padding: "5px 10px", borderRadius: 6, fontSize: 11,
                            background: "transparent", color: "var(--muted)",
                            border: "0.5px solid var(--border)", cursor: "pointer",
                        }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontSize: 12, color: val ? "var(--text)" : "var(--muted)", margin: 0, lineHeight: 1.5, flex: 1 }}>
                        {val || placeholder}
                    </p>
                    <button onClick={() => setEditing(true)} style={{
                        padding: "2px 8px", borderRadius: 5, fontSize: 10,
                        border: "0.5px solid var(--border)", background: "transparent",
                        color: "var(--muted)", cursor: "pointer", flexShrink: 0,
                    }}>Edit</button>
                </div>
            )}
        </div>
    );
}

// ─── EDITABLE TAG PICKER ──────────────────────────────────────────────────────

function EditableTags({ label, tags, allOptions, dbField, onSaved }: {
    label: string; tags: string[]; allOptions: string[];
    dbField: string;
    onSaved?: (tags: string[]) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<string[]>(tags);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const toggle = (t: string) => setSelected(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

    async function handleSave() {
        setSaving(true);
        setError("");
        const ok = await saveField(dbField, selected);
        setSaving(false);
        if (!ok) { setError("Save failed."); return; }
        onSaved?.(selected);
        setEditing(false);
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                    {label}
                </p>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {editing && (
                        <button onClick={() => { setEditing(false); setSelected(tags); }} style={{
                            padding: "2px 8px", borderRadius: 5, fontSize: 10,
                            border: "0.5px solid var(--border)", background: "transparent",
                            color: "var(--muted)", cursor: "pointer",
                        }}>Cancel</button>
                    )}
                    <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} style={{
                        padding: "2px 10px", borderRadius: 5, fontSize: 10,
                        border: `0.5px solid ${editing ? "var(--accent)" : "var(--border)"}`,
                        background: editing ? "var(--accent)" : "transparent",
                        color: editing ? "var(--bg)" : "var(--muted)",
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                    }}>
                        {saving ? "…" : editing ? "Save" : "Edit"}
                    </button>
                </div>
            </div>

            {editing ? (
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: error ? 6 : 0 }}>
                        {allOptions.map(opt => (
                            <button key={opt} onClick={() => toggle(opt)} style={{
                                padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                                border: `0.5px solid ${selected.includes(opt) ? "var(--accent)" : "var(--border)"}`,
                                background: selected.includes(opt) ? "rgba(55,138,221,0.1)" : "transparent",
                                color: selected.includes(opt) ? "var(--text)" : "var(--muted)",
                                transition: "all 0.12s",
                            }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                    {error && <p style={{ fontSize: 11, color: "#e24b4a", marginTop: 6 }}>{error}</p>}
                </>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.length > 0
                        ? selected.map(t => (
                            <span key={t} style={{
                                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                                border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)",
                            }}>{t}</span>
                        ))
                        : <span style={{ fontSize: 11, color: "var(--muted)" }}>None set — click Edit</span>
                    }
                </div>
            )}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProfileCard({
    name, username, email, image, bannerImage, bio,
    role, domain, experienceLevel,
    availability, mission,
    prefTechs, prefTopics,
    projects, reliabilityScore, builderScore,
    isOwner = false,
}: ProfileCardProps) {

    // ── Local state mirrors DB values ─────────────────────────────────────────
    const [avatarSrc, setAvatarSrc] = useState<string | null>(image);
    const [bannerSrc, setBannerSrc] = useState<string | null>(bannerImage);
    const [localName, setLocalName] = useState(name);
    const [localBio, setLocalBio] = useState(bio ?? "");
    const [localTechs, setLocalTechs] = useState<string[]>(prefTechs);
    const [localTopics, setLocalTopics] = useState<string[]>(prefTopics);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
    const [cropState, setCropState] = useState<{ src: string; aspect: number; target: "avatar" | "banner" } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const expLabel = experienceLevel
        ? ({ BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as Record<string, string>)[experienceLevel] ?? experienceLevel
        : null;

    // ── Image flow: pick → crop → upload → save ───────────────────────────────
    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setCropState({ src: ev.target?.result as string, aspect: target === "avatar" ? 1 : 4, target });
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    async function onCropSave(dataUrl: string) {
        if (!cropState) return;
        const target = cropState.target;
        setCropState(null);

        // Convert dataUrl to File for upload
        const blob = await fetch(dataUrl).then(r => r.blob());
        const file = new File([blob], `${target}.jpg`, { type: "image/jpeg" });

        if (target === "avatar") {
            setAvatarSrc(dataUrl);   // optimistic
            setUploadingAvatar(true);
            const url = await uploadImage(file, "avatar");
            setUploadingAvatar(false);
            if (url) {
                setAvatarSrc(url);
                await saveField("image", url);
            }
        } else {
            setBannerSrc(dataUrl);   // optimistic
            setUploadingBanner(true);
            const url = await uploadImage(file, "banner");
            setUploadingBanner(false);
            if (url) {
                setBannerSrc(url);
                await saveField("bannerImage", url);
            }
        }
    }

    const displayedProjects = showAll ? projects : projects.slice(0, 3);

    return (
        <>
            {/* Hidden file inputs */}
            {isOwner && (
                <>
                    <input title="Profile Picture" ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => onFileSelected(e, "avatar")} />
                    <input title="Banner" ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => onFileSelected(e, "banner")} />
                </>
            )}

            {viewer && <FullScreenViewer src={viewer.src} alt={viewer.alt} onClose={() => setViewer(null)} />}
            {cropState && <CropModal src={cropState.src} aspect={cropState.aspect} onSave={onCropSave} onCancel={() => setCropState(null)} />}

            <style>{`
                .pc-banner:hover .pc-banner-hint { opacity: 1 !important; }
                .pc-avatar-wrap:hover .pc-avatar-hint { opacity: 1 !important; }
            `}</style>

            <div style={{
                width: "100%", borderRadius: 12,
                border: "0.5px solid var(--border)", background: "var(--surface)",
                overflow: "visible", position: "relative",
            }}>
                {/* ── BANNER ── */}
                <div
                    className="pc-banner"
                    onClick={() => {
                        if (isOwner) bannerInputRef.current?.click();
                        else if (bannerSrc) setViewer({ src: bannerSrc, alt: "Banner" });
                    }}
                    style={{
                        position: "relative", height: 84,
                        cursor: isOwner ? "pointer" : (bannerSrc ? "zoom-in" : "default"),
                        background: bannerSrc ? undefined : DEFAULT_BANNER,
                        overflow: "hidden", borderRadius: "12px 12px 0 0",
                    }}
                >
                    {bannerSrc && (
                        <NextImage src={bannerSrc} alt="Banner" fill style={{ objectFit: "cover" }} sizes="320px" priority />
                    )}

                    {/* Uploading overlay */}
                    {uploadingBanner && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <UploadSpinner />
                        </div>
                    )}

                    {/* Edit hint */}
                    {isOwner && !uploadingBanner && (
                        <div className="pc-banner-hint" style={{
                            position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.15s",
                            background: "rgba(0,0,0,0.35)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            pointerEvents: "none",
                        }}>
                            <span style={{ fontSize: 11, color: "#fff", padding: "4px 12px", borderRadius: 20, background: "rgba(0,0,0,0.6)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                                Edit banner
                            </span>
                        </div>
                    )}

                    {/* Builder badge */}
                    <div style={{ position: "absolute", top: 8, right: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "0.5px solid rgba(255,255,255,0.15)", zIndex: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 9, color: "#93c5fd", fontWeight: 500 }}>Builder</span>
                    </div>
                </div>

                {/* ── AVATAR ── */}
                <div style={{ position: "relative", zIndex: 10, height: 0, overflow: "visible", paddingLeft: 16 }}>
                    <div
                        className="pc-avatar-wrap"
                        onClick={() => {
                            if (isOwner) avatarInputRef.current?.click();
                            else if (avatarSrc) setViewer({ src: avatarSrc, alt: localName });
                        }}
                        style={{
                            position: "absolute", top: -28, left: 16,
                            width: 56, height: 56, borderRadius: "50%",
                            border: "2.5px solid var(--surface)",
                            background: "var(--surface2)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: isOwner ? "pointer" : (avatarSrc ? "zoom-in" : "default"),
                            zIndex: 10,
                        }}
                    >
                        {avatarSrc ? (
                            <NextImage src={avatarSrc} alt={localName} width={56} height={56}
                                style={{ objectFit: "cover", borderRadius: "50%", width: "100%", height: "100%" }}
                            />
                        ) : (
                            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                                {localName.charAt(0).toUpperCase()}
                            </span>
                        )}

                        {/* Uploading overlay */}
                        {uploadingAvatar && (
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <UploadSpinner size={16} />
                            </div>
                        )}

                        {/* Edit hint */}
                        {isOwner && !uploadingAvatar && (
                            <div className="pc-avatar-hint" style={{
                                position: "absolute", inset: 0, borderRadius: "50%",
                                background: "rgba(0,0,0,0.55)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: 0, transition: "opacity 0.15s", pointerEvents: "none",
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div style={{ padding: "36px 16px 16px" }}>

                    {/* Name + username + badges */}
                    <div style={{ marginBottom: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 2 }}>
                            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>{localName}</h2>
                            {expLabel && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)" }}>
                                    {expLabel}
                                </span>
                            )}
                            {(reliabilityScore ?? 0) >= 90 && (
                                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "0.5px solid rgba(34,197,94,0.2)" }}>
                                    {reliabilityScore}% reliable
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>@{username}</p>
                    </div>

                    {(role || domain) && (
                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, marginBottom: 0, textTransform: "capitalize" }}>
                            {[role, domain].filter(Boolean).join(" · ")}
                        </p>
                    )}

                    <div style={{ height: "0.5px", background: "var(--border)", margin: "12px 0" }} />

                    {/* ── Owner editable fields ── */}
                    {isOwner ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <EditableField
                                label="Display name" value={localName} placeholder="Your name"
                                dbField="name" maxLength={50}
                                onSaved={v => setLocalName(v)}
                            />
                            <EditableField
                                label="Bio" value={localBio} placeholder="e.g. Building AI tools for developers."
                                multiline dbField="bio" maxLength={280}
                                onSaved={v => setLocalBio(v)}
                            />
                            <EditableTags
                                label="Tech stack" tags={localTechs} allOptions={TECH_OPTIONS}
                                dbField="prefTechs" onSaved={v => setLocalTechs(v)}
                            />
                            <EditableTags
                                label="Interests" tags={localTopics} allOptions={TOPIC_OPTIONS}
                                dbField="prefTopics" onSaved={v => setLocalTopics(v)}
                            />
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {localBio && (
                                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{localBio}</p>
                            )}
                            {localTechs.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                                    {localTechs.map(t => (
                                        <span key={t} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, border: "0.5px solid var(--border)", color: "var(--muted)", background: "var(--surface2)" }}>{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ height: "0.5px", background: "var(--border)", margin: "12px 0" }} />

                    {/* ── Active projects ── */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                            Active projects
                        </p>
                        {projects.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "14px 0" }}>
                                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>No active projects yet</p>
                                <Link href="/projects" style={{ display: "inline-block", padding: "7px 16px", borderRadius: 7, fontSize: 12, background: "var(--accent)", color: "var(--bg)", textDecoration: "none", fontWeight: 500 }}>
                                    Explore projects →
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {displayedProjects.map(p => (
                                    <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                                        <div className="card-hover" style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "8px 12px", borderRadius: 8,
                                            border: "0.5px solid var(--border)", background: "var(--surface2)",
                                        }}>
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
                                    <button onClick={() => setShowAll(v => !v)} style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        fontSize: 11, color: "var(--accent)", padding: "3px 0", textAlign: "left",
                                    }}>
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

// ─── Upload spinner ───────────────────────────────────────────────────────────
function UploadSpinner({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
            style={{ animation: "spin 0.75s linear infinite" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
    );
}