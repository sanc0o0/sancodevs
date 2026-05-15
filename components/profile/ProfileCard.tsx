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
    email: string;
    image: string | null;
    role: string | null;
    domain: string | null;
    experienceLevel: string | null;
    availability: string | null;
    mission: string | null;
    location?: string | null;
    timezone?: string | null;
    projects: Project[];
    reliabilityScore: number;
    builderScore?: number;
    /** true  = owner's own profile (/profile) — shows edit options  */
    isOwner?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e", IN_PROGRESS: "#378ADD", CLOSED: "#666",
    COMPLETED: "#639922", TERMINATED: "#e24b4a",
};

const DEFAULT_BANNER = "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";

// ─── FULL-SCREEN VIEWER ──────────────────────────────────────────────────────
// z-index: 99999 — sits above sidebar (z-index ~50) and everything else

function FullScreenViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,           // above sidebar, above everything
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                cursor: "zoom-out",
                animation: "fadeIn 0.15s ease",
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: "min(90vw, 900px)",
                    maxHeight: "88vh",
                    borderRadius: 12,
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
                    objectFit: "contain",
                    cursor: "default",
                    display: "block",
                }}
            />
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: 20, right: 20,
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "0.5px solid rgba(255,255,255,0.2)",
                    color: "#fff", fontSize: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                }}
            >
                ✕
            </button>
            <p style={{
                position: "absolute", bottom: 18,
                left: "50%", transform: "translateX(-50%)",
                fontSize: 11, color: "rgba(255,255,255,0.3)",
                pointerEvents: "none", whiteSpace: "nowrap",
            }}>
                Press Esc or click anywhere to close
            </p>
        </div>
    );
}

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────

function ContextMenu({
    x, y, target, onView, onEdit, onClose,
}: {
    x: number; y: number; target: "avatar" | "banner";
    onView: () => void; onEdit: () => void; onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const t = setTimeout(() => window.addEventListener("mousedown", handler), 20);
        return () => { clearTimeout(t); window.removeEventListener("mousedown", handler); };
    }, [onClose]);

    const W = 200;
    const safeX = Math.min(x, window.innerWidth - W - 8);
    const safeY = Math.min(y + 4, window.innerHeight - 100);

    return (
        <div
            ref={ref}
            style={{
                position: "fixed", left: safeX, top: safeY,
                zIndex: 99998,
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 9, overflow: "hidden",
                width: W,
                boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                animation: "fadeIn 0.1s ease",
            }}
        >
            {([
                { label: `View ${target === "avatar" ? "profile picture" : "banner"}`, icon: "/icons8-view-24.png", action: onView },
                { label: `Edit ${target === "avatar" ? "profile picture" : "banner"}`, icon: "/icons8-edit-pencil-50.png", action: onEdit },
            ] as const).map((item, i) => (
                <button
                    key={i}
                    onClick={() => { item.action(); onClose(); }}
                    className="dropdown-item"
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        borderBottom: i === 0 ? "0.5px solid var(--border)" : "none",
                        color: "var(--text)", fontSize: 12,
                        cursor: "pointer", textAlign: "left",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    <NextImage src={item.icon} alt="" width={14} height={14}
                        style={{ filter: "invert(1) brightness(0.65)", flexShrink: 0 }} />
                    {item.label}
                </button>
            ))}
        </div>
    );
}

// ─── CROP MODAL ──────────────────────────────────────────────────────────────
// Key fix: measure img position with getBoundingClientRect RELATIVE to container
// Store offset in state (not read from ref during render)

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
    // naturalSize: real pixel dimensions of source image
    const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
    // displaySize: rendered pixel dimensions inside container
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
    // imgOffset: top-left of the rendered img relative to the container div
    const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
    // crop coords in display-image space (relative to img top-left, not container)
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

    // drag/resize as refs to avoid stale closure issues
    const drag = useRef<{ active: boolean; startMx: number; startMy: number; startCx: number; startCy: number }>({ active: false, startMx: 0, startMy: 0, startCx: 0, startCy: 0 });
    const resize = useRef<{ active: boolean; startMx: number; startCw: number }>({ active: false, startMx: 0, startCw: 0 });

    function clamp(c: typeof crop, dw: number, dh: number) {
        const w = Math.max(40, Math.min(c.w, dw));
        const h = w / aspect;
        const x = Math.max(0, Math.min(c.x, dw - w));
        const y = Math.max(0, Math.min(c.y, dh - h));
        return { x, y, w, h: Math.min(h, dh - y) };
    }

    // Called AFTER image has loaded and painted — measure via getBoundingClientRect
    function measureAndInit() {
        const img = imgRef.current;
        const cont = containerRef.current;
        if (!img || !cont) return;

        const iRect = img.getBoundingClientRect();
        const cRect = cont.getBoundingClientRect();

        const dw = iRect.width;
        const dh = iRect.height;
        // offset of img top-left corner relative to container top-left
        const ox = iRect.left - cRect.left;
        const oy = iRect.top - cRect.top;

        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        setDisplaySize({ w: dw, h: dh });
        setImgOffset({ x: ox, y: oy });

        // Initial crop: centred, 80% of display width
        const w = Math.min(dw * 0.8, dh * aspect * 0.8);
        const h = w / aspect;
        setCrop({ x: (dw - w) / 2, y: (dh - h) / 2, w, h });
        setImgLoaded(true);
    }

    function onImgLoad() {
        // requestAnimationFrame ensures the browser has painted and rects are accurate
        requestAnimationFrame(() => requestAnimationFrame(measureAndInit));
    }

    // Global pointer events
    const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
        const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
        const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

        if (drag.current.active) {
            const dx = cx - drag.current.startMx;
            const dy = cy - drag.current.startMy;
            setCrop(prev => clamp({
                ...prev,
                x: drag.current.startCx + dx,
                y: drag.current.startCy + dy,
            }, displaySize.w, displaySize.h));
        }
        if (resize.current.active) {
            const dx = cx - resize.current.startMx;
            const nw = Math.max(40, resize.current.startCw + dx);
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

    // Re-measure on window resize
    useEffect(() => {
        if (!imgLoaded) return;
        const handler = () => {
            setImgLoaded(false);
            requestAnimationFrame(() => requestAnimationFrame(measureAndInit));
        };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [imgLoaded]);

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

        // Scale from display coords to natural image coords
        const scaleX = naturalSize.w / displaySize.w;
        const scaleY = naturalSize.h / displaySize.h;

        const outW = aspect === 1 ? 400 : 1200;
        const outH = aspect === 1 ? 400 : 300;
        canvas.width = outW;
        canvas.height = outH;

        const ctx = canvas.getContext("2d");
        if (!ctx) { setSaving(false); return; }
        ctx.drawImage(
            img,
            crop.x * scaleX, crop.y * scaleY,
            crop.w * scaleX, crop.h * scaleY,
            0, 0, outW, outH
        );
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        onSave(dataUrl);
        setSaving(false);
    }

    // Crop box position in container coords = imgOffset + crop
    const boxLeft = imgOffset.x + crop.x;
    const boxTop = imgOffset.y + crop.y;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeIn 0.15s ease",
        }}>
            <div style={{
                background: "var(--surface)", border: "0.5px solid var(--border)",
                borderRadius: 12, width: "100%", maxWidth: 580, overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{ padding: "13px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                        Crop {aspect === 1 ? "profile picture" : "banner"}
                    </p>
                    <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>✕</button>
                </div>

                {/* ── CROP AREA ── */}
                <div
                    ref={containerRef}
                    style={{
                        position: "relative",
                        width: "100%",
                        background: "#000",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 180,
                        maxHeight: "62vh",
                        // contain the absolute-positioned overlay
                    }}
                >
                    {/* Dim base image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={imgRef}
                        src={src}
                        alt="Crop source"
                        onLoad={onImgLoad}
                        draggable={false}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "62vh",
                            display: "block",
                            opacity: 0.38,
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Crop overlay — only after imgLoaded to avoid ref-during-render */}
                    {imgLoaded && (
                        <div
                            onMouseDown={startDrag}
                            onTouchStart={startDrag}
                            style={{
                                position: "absolute",
                                left: boxLeft,
                                top: boxTop,
                                width: crop.w,
                                height: crop.h,
                                border: `2px solid var(--accent)`,
                                borderRadius: aspect === 1 ? "50%" : 6,
                                boxSizing: "border-box",
                                cursor: "grab",
                                overflow: "hidden",
                                // no pointer events on children so drag feels smooth
                            }}
                        >
                            {/* Bright preview of cropped area */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt=""
                                draggable={false}
                                style={{
                                    position: "absolute",
                                    // shift the full image so the crop region aligns at 0,0
                                    left: -crop.x,
                                    top: -crop.y,
                                    width: displaySize.w,
                                    height: displaySize.h,
                                    maxWidth: "none",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            />

                            {/* Rule-of-thirds grid */}
                            <svg
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                                viewBox="0 0 100 100" preserveAspectRatio="none"
                            >
                                {[33.3, 66.6].map(v => (
                                    <g key={v}>
                                        <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                        <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    </g>
                                ))}
                            </svg>

                            {/* Corner handles */}
                            {([{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }] as React.CSSProperties[]).map((pos, i) => (
                                <div key={i} style={{ position: "absolute", ...pos, width: 12, height: 12, border: "2.5px solid var(--accent)", borderRadius: 2, background: "var(--bg)", pointerEvents: "none" }} />
                            ))}

                            {/* Resize handle — bottom-right */}
                            <div
                                onMouseDown={startResize}
                                onTouchStart={startResize}
                                style={{
                                    position: "absolute", bottom: -10, right: -10,
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: "var(--accent)", border: "2px solid var(--bg)",
                                    cursor: "nwse-resize", zIndex: 5,
                                }}
                            />
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Footer */}
                <div style={{ padding: "13px 18px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} className="btn-ghost" style={{ fontSize: 12 }}>Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={!imgLoaded || saving}
                        className="btn-action"
                        style={{ fontSize: 12, opacity: !imgLoaded || saving ? 0.5 : 1 }}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── EDITABLE FIELD ──────────────────────────────────────────────────────────

function EditableField({ label, value, placeholder, onSave }: {
    label: string; value: string; placeholder: string;
    onSave: (val: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await onSave(val);
        setSaving(false);
        setEditing(false);
    }

    return (
        <div style={{ padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</p>
            {editing ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                        autoFocus value={val}
                        onChange={e => setVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                        className="form-input" placeholder={placeholder}
                        style={{ flex: 1, fontSize: 12, padding: "5px 8px" }}
                    />
                    <button onClick={handleSave} disabled={saving} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, background: "var(--accent)", color: "var(--bg)", border: "none", cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                        {saving ? "…" : "Save"}
                    </button>
                    <button onClick={() => { setEditing(false); setVal(value); }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", cursor: "pointer" }}>✕</button>
                </div>
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontSize: 12, color: val ? "var(--text)" : "var(--muted)", margin: 0 }}>{val || placeholder}</p>
                    <button onClick={() => setEditing(true)} className="link-hover" style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, border: "0.5px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Edit</button>
                </div>
            )}
        </div>
    );
}

// ─── EDITABLE TAGS ───────────────────────────────────────────────────────────

function EditableTags({ label, tags, allOptions, onSave }: {
    label: string; tags: string[]; allOptions: string[];
    onSave: (tags: string[]) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<string[]>(tags);
    const [saving, setSaving] = useState(false);

    const toggle = (t: string) => setSelected(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

    async function handleSave() {
        setSaving(true);
        await onSave(selected);
        setSaving(false);
        setEditing(false);
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
                <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} style={{ padding: "2px 10px", borderRadius: 5, fontSize: 10, border: `0.5px solid ${editing ? "var(--accent)" : "var(--border)"}`, background: editing ? "var(--accent)" : "transparent", color: editing ? "var(--bg)" : "var(--muted)", cursor: "pointer" }}>
                    {saving ? "…" : editing ? "Done" : "Edit"}
                </button>
            </div>
            {editing ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {allOptions.map(opt => (
                        <button key={opt} onClick={() => toggle(opt)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, border: `0.5px solid ${selected.includes(opt) ? "var(--accent)" : "var(--border)"}`, background: selected.includes(opt) ? "var(--surface2)" : "transparent", color: selected.includes(opt) ? "var(--text)" : "var(--muted)", cursor: "pointer" }}>
                            {opt}
                        </button>
                    ))}
                </div>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tags.length > 0
                        ? tags.map(t => <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)" }}>{t}</span>)
                        : <span style={{ fontSize: 11, color: "var(--muted)" }}>None set — click Edit</span>}
                </div>
            )}
        </div>
    );
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const POSITION_TYPES = ["Remote", "On-site", "Hybrid", "Full-time", "Part-time", "Contract"];
const SKILLS_OPTIONS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "PostgreSQL", "MongoDB", "Prisma", "Tailwind CSS", "Docker", "GraphQL", "Figma", "Blender", "Three.js", "Go", "Rust", "Swift", "Kotlin", "Flutter", "AWS"];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ProfileCard({
    name, email, image, role, domain, experienceLevel,
    availability, mission, location, timezone,
    projects, reliabilityScore, builderScore,
    isOwner = false,
}: ProfileCardProps) {

    const [avatarSrc, setAvatarSrc] = useState<string | null>(image);
    const [bannerSrc, setBannerSrc] = useState<string | null>(null);

    const [menu, setMenu] = useState<{ x: number; y: number; target: "avatar" | "banner" } | null>(null);
    const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
    const [cropState, setCropState] = useState<{ src: string; aspect: number; target: "avatar" | "banner" } | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [locationVal, setLocationVal] = useState(location ?? "");
    const [timezoneVal, setTimezoneVal] = useState(timezone ?? "");
    const [missionVal, setMissionVal] = useState(mission ?? "");
    const [skills, setSkills] = useState<string[]>([]);
    const [positionTypes, setPositionTypes] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    const expLabel = experienceLevel
        ? ({ BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as Record<string, string>)[experienceLevel] ?? experienceLevel
        : null;

    // ── Save to DB ────────────────────────────────────────────────────────────
    async function saveToDb(field: string, value: unknown) {
        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value }),
            });
        } catch (e) {
            console.error("Profile save failed", e);
        }
    }

    // ── Image click handler ───────────────────────────────────────────────────
    function handleImageClick(e: React.MouseEvent, target: "avatar" | "banner") {
        e.preventDefault();
        e.stopPropagation();
        const src = target === "avatar" ? avatarSrc : bannerSrc;

        if (isOwner) {
            setMenu({ x: e.clientX, y: e.clientY, target });
        } else if (src) {
            // Non-owner: directly open viewer
            setViewer({ src, alt: target === "avatar" ? name : "Profile banner" });
        }
    }

    function handleView(target: "avatar" | "banner") {
        const src = target === "avatar" ? avatarSrc : bannerSrc;
        if (src) setViewer({ src, alt: target === "avatar" ? name : "Profile banner" });
    }

    function handleEdit(target: "avatar" | "banner") {
        if (target === "avatar") avatarInputRef.current?.click();
        else bannerInputRef.current?.click();
    }

    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const src = ev.target?.result as string;
            setCropState({ src, aspect: target === "avatar" ? 1 : 4, target });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    async function onCropSave(dataUrl: string) {
        if (!cropState) return;
        if (cropState.target === "avatar") {
            setAvatarSrc(dataUrl);
            await saveToDb("image", dataUrl);
        } else {
            setBannerSrc(dataUrl);
            await saveToDb("banner", dataUrl);
        }
        setCropState(null);
    }

    const displayedProjects = showAll ? projects : projects.slice(0, 3);

    return (
        <>
            {/* Hidden file inputs — owner only */}
            {isOwner && (
                <>
                    <input title="ProfilePicture" ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onFileSelected(e, "avatar")} />
                    <input title="Banner" ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onFileSelected(e, "banner")} />
                </>
            )}

            {/* Context menu */}
            {menu && isOwner && (
                <ContextMenu
                    x={menu.x} y={menu.y} target={menu.target}
                    onView={() => handleView(menu.target)}
                    onEdit={() => handleEdit(menu.target)}
                    onClose={() => setMenu(null)}
                />
            )}

            {/* Full-screen viewer */}
            {viewer && <FullScreenViewer src={viewer.src} alt={viewer.alt} onClose={() => setViewer(null)} />}

            {/* Crop modal */}
            {cropState && <CropModal src={cropState.src} aspect={cropState.aspect} onSave={onCropSave} onCancel={() => setCropState(null)} />}

            {/* ── CARD ── */}
            <div style={{
                width: "100%",
                borderRadius: 12,
                border: "0.5px solid var(--border)",
                background: "var(--surface)",
                overflow: "visible",   // keep visible so avatar isn't clipped
                fontFamily: "var(--font-body)",
                position: "relative",
            }}>

                {/* ── BANNER ── */}
                <div
                    onClick={e => handleImageClick(e, "banner")}
                    style={{
                        position: "relative",
                        height: 80,
                        cursor: isOwner ? "pointer" : (bannerSrc ? "zoom-in" : "default"),
                        background: bannerSrc ? undefined : DEFAULT_BANNER,
                        overflow: "hidden",
                        borderRadius: "12px 12px 0 0",
                    }}
                    title={isOwner ? "Click to edit or view banner" : undefined}
                >
                    {bannerSrc && (
                        <NextImage src={bannerSrc} alt="Banner" fill style={{ objectFit: "cover" }} sizes="340px" priority />
                    )}

                    {/* Owner hover hint */}
                    {isOwner && (
                        <div className="banner-hint" style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.15s",
                            background: "rgba(0,0,0,0.3)",
                            pointerEvents: "none",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                                <NextImage src="/icons8-edit-pencil-50.png" alt="" width={11} height={11} style={{ filter: "invert(1)" }} />
                                <span style={{ fontSize: 10, color: "#fff", fontWeight: 500 }}>Edit banner</span>
                            </div>
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

                {/* ── AVATAR — floats outside banner via negative margin ── */}
                {/* Wrapper has overflow:visible so the circle isn't clipped */}
                <div style={{
                    position: "relative",
                    zIndex: 10,
                    height: 0,                   // zero height — purely for positioning
                    overflow: "visible",
                    paddingLeft: 16,
                }}>
                    <div
                        onClick={e => handleImageClick(e, "avatar")}
                        title={isOwner ? "Click to edit or view profile picture" : (avatarSrc ? "Click to view" : undefined)}
                        style={{
                            position: "absolute",
                            top: -26,             // pulls avatar upward to overlap banner bottom
                            left: 16,
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            border: "2.5px solid var(--surface)",
                            background: "var(--surface2)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: isOwner ? "pointer" : (avatarSrc ? "zoom-in" : "default"),
                            zIndex: 10,
                        }}
                    >
                        {avatarSrc ? (
                            <NextImage
                                src={avatarSrc}
                                alt={name}
                                width={52}
                                height={52}
                                loading="eager"
                                style={{ objectFit: "cover", borderRadius: "50%", width: "100%", height: "100%" }}
                            />
                        ) : (
                            <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>{name.charAt(0).toUpperCase()}</span>
                        )}

                        {/* Owner edit overlay */}
                        {isOwner && (
                            <div className="avatar-hint" style={{
                                position: "absolute", inset: 0, borderRadius: "50%",
                                background: "rgba(0,0,0,0.55)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: 0, transition: "opacity 0.15s",
                                pointerEvents: "none",
                            }}>
                                <NextImage src="/icons8-edit-pencil-50.png" alt="" width={14} height={14} style={{ filter: "invert(1)" }} />
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    .banner-hint { pointer-events: none !important; }
                    div:hover > .banner-hint { opacity: 1 !important; }
                    div:hover > .avatar-hint  { opacity: 1 !important; }
                `}</style>

                {/* ── BODY — padding-top accounts for the avatar overlap ── */}
                <div style={{ padding: "32px 16px 16px" }}>

                    {/* Name + badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>{name}</h2>
                        {expLabel && (
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)" }}>
                                {expLabel}
                            </span>
                        )}
                        {reliabilityScore >= 90 && (
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "0.5px solid rgba(34,197,94,0.2)" }}>
                                {reliabilityScore}% reliable
                            </span>
                        )}
                    </div>

                    {(role || domain) && (
                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                            {[role, domain].filter(Boolean).join(" · ")}
                        </p>
                    )}

                    <div style={{ height: "0.5px", background: "var(--border)", marginBottom: 12 }} />

                    {/* Owner sees editable fields; visitors see read-only */}
                    {isOwner ? (
                        <>
                            <div style={{ marginBottom: 12 }}>
                                <EditableTags label="Skills" tags={skills} allOptions={SKILLS_OPTIONS}
                                    onSave={async v => { setSkills(v); await saveToDb("skills", v); }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <EditableTags label="Position type" tags={positionTypes} allOptions={POSITION_TYPES}
                                    onSave={async v => { setPositionTypes(v); await saveToDb("positionTypes", v); }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                                <EditableField label="Location" value={locationVal} placeholder="e.g. Mumbai, IN"
                                    onSave={async v => { setLocationVal(v); await saveToDb("location", v); }} />
                                <EditableField label="Timezone" value={timezoneVal} placeholder="e.g. UTC+5:30"
                                    onSave={async v => { setTimezoneVal(v); await saveToDb("timezone", v); }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <EditableField label="Current mission" value={missionVal} placeholder="e.g. Looking to join AI projects"
                                    onSave={async v => { setMissionVal(v); await saveToDb("mission", v); }} />
                            </div>
                        </>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {(location || timezone) && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {location && (
                                        <div style={{ padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Location</p>
                                            <p style={{ fontSize: 12, color: "var(--text)", margin: 0 }}>{location}</p>
                                        </div>
                                    )}
                                    {timezone && (
                                        <div style={{ padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Timezone</p>
                                            <p style={{ fontSize: 12, color: "var(--text)", margin: 0 }}>{timezone}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {mission && (
                                <div style={{ padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                    <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Mission</p>
                                    <p style={{ fontSize: 12, color: "var(--text)", margin: 0 }}>{mission}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ height: "0.5px", background: "var(--border)", marginBottom: 12 }} />

                    {/* Active projects */}
                    <div style={{ marginBottom: 12 }}>
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
                                        <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[p.status] ?? "var(--muted)", flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                                                <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{p.role}</p>
                                            </div>
                                            <span style={{ fontSize: 9, fontWeight: 600, color: STATUS_COLORS[p.status] ?? "var(--muted)", textTransform: "uppercase", flexShrink: 0 }}>{p.status.replace("_", " ")}</span>
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

                    <div style={{ height: "0.5px", background: "var(--border)", marginBottom: 12 }} />

                </div>
            </div>
        </>
    );
}