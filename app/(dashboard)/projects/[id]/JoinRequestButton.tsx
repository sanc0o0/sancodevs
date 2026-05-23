"use client";

// app/(dashboard)/projects/[id]/JoinRequestButton.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "UI/UX Designer", "Mobile Developer", "DevOps / Infrastructure",
    "ML / AI Engineer", "Data Analyst", "QA / Tester",
    "Product Manager", "Technical Writer", "Other",
];

const AVAILABILITY_OPTIONS = [
    { value: "WEEKENDS", label: "Weekends only", sub: "~8–10 hrs/week" },
    { value: "PART_TIME", label: "Part-time", sub: "1–3 hrs/day" },
    { value: "FULL_TIME", label: "Full-time", sub: "6+ hrs/day" },
];

const ACCEPTED_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type Step = 1 | 2 | 3;

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidUrl(raw: string | null | undefined): boolean {
    if (!raw?.trim()) return false;
    try {
        const u = new URL(raw.trim());
        return u.protocol === "https:" || u.protocol === "http:";
    } catch { return false; }
}

function isGithubUrl(raw: string | null | undefined): boolean {
    if (!raw?.trim()) return false;
    try {
        const u = new URL(raw.trim());
        return u.hostname === "github.com" && u.pathname.replace(/\/$/, "").length > 1;
    } catch { return false; }
}

function containsSpam(s: string): boolean {
    return /\b(click here|free money|crypto|nft|telegram|whatsapp me|buy now)\b/i.test(s)
        || /(.)\1{8,}/.test(s);
}

function sanitize(s: string): string {
    return s.replace(/<[^>]*>/g, "").replace(/\s{3,}/g, "  ").trim();
}

// ─── Draft (localStorage) — file can't be persisted, just its name ────────────

interface DraftData {
    message: string; pitch: string; desiredRole: string; availability: string;
    portfolioUrl: string; githubUrl: string; linkedinUrl: string;
    resumeFileName?: string;
    savedAt: number;
}

const dKey = (id: string) => `join_draft_${id}`;

function saveDraft(projectId: string, d: Omit<DraftData, "savedAt">) {
    try { localStorage.setItem(dKey(projectId), JSON.stringify({ ...d, savedAt: Date.now() })); }
    catch { /* quota / SSR */ }
}

function loadDraft(projectId: string): DraftData | null {
    try {
        const raw = localStorage.getItem(dKey(projectId));
        if (!raw) return null;
        const parsed: DraftData = JSON.parse(raw);
        if (Date.now() - parsed.savedAt > 7 * 86_400_000) {
            localStorage.removeItem(dKey(projectId));
            return null;
        }
        return parsed;
    } catch { return null; }
}

function clearDraft(projectId: string) {
    try { localStorage.removeItem(dKey(projectId)); } catch { /* */ }
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "0.5px solid var(--border)", background: "var(--bg)",
    color: "var(--text)", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { projectId: string; projectTitle: string }

export default function JoinRequestButton({ projectId, projectTitle }: Props) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saveFlash, setSaveFlash] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const [draftRestored, setDraft] = useState(false);

    // text fields
    const [message, setMessage] = useState("");
    const [pitch, setPitch] = useState("");
    const [desiredRole, setRole] = useState("");
    const [availability, setAvail] = useState("");
    const [githubUrl, setGithub] = useState("");
    const [portfolioUrl, setPortfolio] = useState("");
    const [linkedinUrl, setLinkedin] = useState("");

    // resume
    const [resumeFile, setFile] = useState<File | null>(null);
    const [uploadedUrl, setUploaded] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [draftFileName, setDraftName] = useState<string | null>(null);

    useEffect(() => { setHasDraft(!!loadDraft(projectId)); }, [projectId]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") close(); }, []);
    useEffect(() => {
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onKey]);

    function reset() {
        setMessage(""); setPitch(""); setRole(""); setAvail("");
        setGithub(""); setPortfolio(""); setLinkedin("");
        setFile(null); setUploaded(null); setDraftName(null);
    }

    function openModal() {
        const d = loadDraft(projectId);
        if (d) {
            setMessage(d.message); setPitch(d.pitch);
            setRole(d.desiredRole); setAvail(d.availability);
            setGithub(d.githubUrl); setPortfolio(d.portfolioUrl);
            setLinkedin(d.linkedinUrl);
            if (d.resumeFileName) setDraftName(d.resumeFileName);
            setDraft(true);
        } else { setDraft(false); }
        setStep(1); setError("");
        setOpen(true);
    }

    function close() { setOpen(false); setStep(1); setError(""); setDraft(false); }
    function hardClose() { close(); reset(); }

    function handleSave() {
        saveDraft(projectId, {
            message, pitch, desiredRole: desiredRole, availability,
            githubUrl, portfolioUrl, linkedinUrl,
            resumeFileName: resumeFile?.name ?? draftFileName ?? undefined,
        });
        setHasDraft(true);
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2000);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    function validateStep1(): string | null {
        if (!desiredRole) return "Please select a role.";
        if (!availability) return "Please select your availability.";
        if (message && containsSpam(message)) return "Your message contains prohibited content.";
        return null;
    }

    function validateStep2(): string | null {
        const words = pitch.trim().split(/\s+/).filter(Boolean).length;
        if (words < 15) return "Please write at least 15 words about what you bring.";
        if (containsSpam(pitch)) return "Your pitch contains prohibited content.";
        return null;
    }

    function validateStep3(): string | null {
        const hasResume = resumeFile || uploadedUrl || draftFileName;
        if (!hasResume) return "Please upload your resume / CV.";
        if (!githubUrl.trim()) return "GitHub profile URL is required.";
        if (!isGithubUrl(githubUrl)) return "Enter a valid GitHub URL — e.g. https://github.com/username";
        if (portfolioUrl && !isValidUrl(portfolioUrl)) return "Portfolio URL is invalid.";
        if (linkedinUrl && !isValidUrl(linkedinUrl)) return "LinkedIn URL is invalid.";
        return null;
    }

    function nextStep() {
        setError("");
        const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
        if (err) { setError(err); return; }
        setStep(s => (s + 1) as Step);
    }

    // ── Upload resume to /api/upload/resume ───────────────────────────────────
    async function uploadFile(file: File): Promise<string> {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
            if (!res.ok) {
                const d = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(d.error ?? "Upload failed");
            }
            const data = await res.json() as { url: string };
            return data.url;
        } finally { setUploading(false); }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function submit() {
        const err = validateStep3();
        if (err) { setError(err); return; }

        setLoading(true); setError("");
        try {
            let finalUrl = uploadedUrl;

            if (resumeFile && !uploadedUrl) {
                try {
                    finalUrl = await uploadFile(resumeFile);
                    setUploaded(finalUrl);
                } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Resume upload failed. Try again.");
                    setLoading(false); return;
                }
            }

            if (!finalUrl) {
                setError("Resume upload is required. Please re-upload your file.");
                setLoading(false); return;
            }

            const res = await fetch("/api/projects/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    message: sanitize(message),
                    pitch: sanitize(pitch),
                    desiredRole,
                    availability,
                    resumeUrl: finalUrl,
                    portfolioUrl: portfolioUrl.trim() || null,
                    githubUrl: githubUrl.trim(),
                    linkedinUrl: linkedinUrl.trim() || null,
                }),
            });

            if (res.ok) {
                clearDraft(projectId);
                setHasDraft(false);
                hardClose();
                router.refresh();
            } else {
                const d = await res.json() as { error?: string };
                setError(d.error ?? "Failed to send application. Please try again.");
            }
        } catch {
            setError("Network error — check your connection and try again.");
        }
        setLoading(false);
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Trigger */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={openModal} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 18px", borderRadius: 9,
                    fontSize: 13, fontWeight: 600,
                    background: "var(--accent)", color: "var(--bg)",
                    border: "none", cursor: "pointer", transition: "opacity 0.15s",
                    whiteSpace: "nowrap", flexShrink: 0,
                }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                    <JoinIcon /> Request to join
                </button>

                {hasDraft && !open && (
                    <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 6,
                        background: "rgba(55,138,221,0.1)", color: "var(--accent)",
                        border: "0.5px solid rgba(55,138,221,0.25)",
                    }}>Draft saved</span>
                )}
            </div>

            {/* Modal */}
            {open && (
                <div onClick={e => { if (e.target === e.currentTarget) close(); }} style={{
                    position: "fixed", inset: 0, zIndex: 9999, top: "64px",
                    background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
                }}>
                    <style>{`
                        @keyframes modalIn { from{opacity:0;transform:translateY(10px) scale(.98)} to{opacity:1;transform:none} }
                        @keyframes spin    { to{transform:rotate(360deg)} }
                    `}</style>

                    <div style={{
                        width: "100%", maxWidth: 520, maxHeight: "90vh",
                        background: "var(--surface)", border: "0.5px solid var(--border)",
                        borderRadius: 14, overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
                        animation: "modalIn 0.18s ease",
                    }}>

                        {/* ── Header ── */}
                        <div style={{
                            padding: "15px 18px", borderBottom: "0.5px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                        }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Apply to join</p>
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {projectTitle}
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {/* Save for later */}
                                <button onClick={handleSave} style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "5px 10px", borderRadius: 7, fontSize: 11,
                                    border: `0.5px solid ${saveFlash ? "var(--accent)" : "var(--border)"}`,
                                    background: "transparent",
                                    color: saveFlash ? "var(--accent)" : "var(--muted)",
                                    cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                                }}
                                    onMouseEnter={e => { if (!saveFlash) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; } }}
                                    onMouseLeave={e => { if (!saveFlash) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; } }}
                                >
                                    <SaveIcon />
                                    {saveFlash ? "Saved ✓" : "Save for later"}
                                </button>
                                <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 6, borderRadius: 6, display: "flex" }}>
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* Draft restored banner */}
                        {draftRestored && (
                            <div style={{
                                padding: "8px 18px",
                                background: "rgba(55,138,221,0.06)", borderBottom: "0.5px solid rgba(55,138,221,0.15)",
                                display: "flex", alignItems: "center", gap: 7,
                            }}>
                                <InfoIcon />
                                <span style={{ fontSize: 11, color: "var(--accent)" }}>Draft restored — continue where you left off.</span>
                            </div>
                        )}

                        {/* ── Body ── */}
                        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                            <StepIndicator current={step} />

                            <div style={{ marginTop: 20 }}>
                                {step === 1 && (
                                    <StepOne
                                        desiredRole={desiredRole} setDesiredRole={setRole}
                                        availability={availability} setAvailability={setAvail}
                                        message={message} setMessage={setMessage}
                                        projectTitle={projectTitle}
                                    />
                                )}
                                {step === 2 && <StepTwo pitch={pitch} setPitch={setPitch} />}
                                {step === 3 && (
                                    <StepThree
                                        githubUrl={githubUrl} setGithubUrl={setGithub}
                                        portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolio}
                                        linkedinUrl={linkedinUrl} setLinkedinUrl={setLinkedin}
                                        resumeFile={resumeFile} setResumeFile={setFile}
                                        uploading={uploading}
                                        uploadedUrl={uploadedUrl}
                                        draftFileName={draftFileName}
                                        onClearResume={() => { setFile(null); setUploaded(null); setDraftName(null); }}
                                    />
                                )}
                            </div>

                            {error && (
                                <div style={{
                                    display: "flex", alignItems: "flex-start", gap: 7, marginTop: 14,
                                    padding: "9px 12px", borderRadius: 8,
                                    background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.3)",
                                }}>
                                    <AlertIcon />
                                    <p style={{ fontSize: 12, color: "#e24b4a", margin: 0, lineHeight: 1.5 }}>{error}</p>
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            padding: "13px 18px", borderTop: "0.5px solid var(--border)",
                            display: "flex", gap: 8, flexShrink: 0,
                        }}>
                            <button type="button"
                                onClick={() => step === 1 ? close() : setStep(s => (s - 1) as Step)}
                                style={{
                                    flex: 1, padding: "9px", borderRadius: 8, fontSize: 13,
                                    border: "0.5px solid var(--border)", background: "transparent",
                                    color: "var(--muted)", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                            >
                                {step === 1 ? <><CloseIcon size={12} /> Cancel</> : <><BackIcon /> Back</>}
                            </button>

                            {step < 3 ? (
                                <button type="button" onClick={nextStep} style={{
                                    flex: 2, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                                    background: "var(--accent)", color: "var(--bg)", border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}>
                                    Continue <NextIcon />
                                </button>
                            ) : (
                                <button type="button" onClick={submit} disabled={loading || uploading} style={{
                                    flex: 2, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                                    background: "var(--accent)", color: "var(--bg)", border: "none",
                                    cursor: (loading || uploading) ? "not-allowed" : "pointer",
                                    opacity: (loading || uploading) ? 0.6 : 1,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}>
                                    {(loading || uploading) ? <SpinnerIcon /> : <SendIcon />}
                                    {uploading ? "Uploading…" : loading ? "Sending…" : "Send application"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
    const labels = ["About you", "Your pitch", "Resume & Links"];
    return (
        <div style={{ display: "flex", alignItems: "flex-start" }}>
            {([1, 2, 3] as Step[]).map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: s < 3 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700,
                            background: current >= s ? "var(--accent)" : "var(--surface2)",
                            color: current >= s ? "var(--bg)" : "var(--muted)",
                            border: `0.5px solid ${current >= s ? "var(--accent)" : "var(--border)"}`,
                            transition: "all 0.2s",
                        }}>
                            {current > s
                                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                : s}
                        </div>
                        <span style={{ fontSize: 9, color: current >= s ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap" }}>{labels[i]}</span>
                    </div>
                    {s < 3 && (
                        <div style={{
                            flex: 1, height: 1, marginTop: 12, marginLeft: 6, marginRight: 6,
                            background: current > s ? "var(--accent)" : "var(--border)",
                            transition: "background 0.2s",
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function StepOne({ desiredRole, setDesiredRole, availability, setAvailability, message, setMessage, projectTitle }: {
    desiredRole: string; setDesiredRole: (v: string) => void;
    availability: string; setAvailability: (v: string) => void;
    message: string; setMessage: (v: string) => void;
    projectTitle: string;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
                <FieldLabel required>Desired role</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
                    {ROLE_OPTIONS.map(r => (
                        <button key={r} type="button" onClick={() => setDesiredRole(r)} style={{
                            padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", transition: "all 0.12s",
                            border: `0.5px solid ${desiredRole === r ? "var(--accent)" : "var(--border)"}`,
                            background: desiredRole === r ? "var(--accent)" : "transparent",
                            color: desiredRole === r ? "var(--bg)" : "var(--muted)",
                            fontWeight: desiredRole === r ? 600 : 400,
                        }}>{r}</button>
                    ))}
                </div>
            </div>

            <div>
                <FieldLabel required>Availability</FieldLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 7 }}>
                    {AVAILABILITY_OPTIONS.map(a => (
                        <button key={a.value} type="button" onClick={() => setAvailability(a.value)} style={{
                            padding: "10px 13px", borderRadius: 8, fontSize: 12,
                            cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                            border: `0.5px solid ${availability === a.value ? "var(--accent)" : "var(--border)"}`,
                            background: availability === a.value ? "rgba(55,138,221,0.08)" : "transparent",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                            <span style={{ fontWeight: availability === a.value ? 500 : 400, color: "var(--text)" }}>{a.label}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <FieldLabel>Why do you want to join? <Opt /></FieldLabel>
                <textarea
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder={`What draws you to ${projectTitle}?`}
                    rows={3} maxLength={500}
                    style={{ ...inputBase, resize: "none", marginTop: 7 }}
                />
                <p style={{ fontSize: 10, color: "var(--muted)", textAlign: "right", margin: "4px 0 0" }}>{message.length}/500</p>
            </div>
        </div>
    );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function StepTwo({ pitch, setPitch }: { pitch: string; setPitch: (v: string) => void }) {
    const words = pitch.trim().split(/\s+/).filter(Boolean).length;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                    <FieldLabel required>Your pitch</FieldLabel>
                    <span style={{ fontSize: 10, color: words >= 30 ? "#22c55e" : words >= 15 ? "#facc15" : "var(--muted)" }}>
                        {words} words{words >= 30 ? " ✓" : " — aim for 30+"}
                    </span>
                </div>
                <textarea
                    value={pitch} onChange={e => setPitch(e.target.value)}
                    placeholder="Describe what you bring: relevant skills, past projects, how you'll contribute…"
                    rows={7} maxLength={1500}
                    style={{ ...inputBase, resize: "none" }}
                />
                <p style={{ fontSize: 10, color: "var(--muted)", textAlign: "right", margin: "4px 0 0" }}>{pitch.length}/1500</p>
            </div>

            <div style={{ padding: "11px 13px", borderRadius: 8, background: "var(--surface2)", border: "0.5px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Tips</p>
                {[
                    "Be specific about your skills and tools",
                    "Mention a relevant past project or contribution",
                    "Explain exactly what problem you can help solve",
                ].map(tip => (
                    <div key={tip} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Step 3 — Resume upload + links ──────────────────────────────────────────

interface S3Props {
    githubUrl: string; setGithubUrl: (v: string) => void;
    portfolioUrl: string; setPortfolioUrl: (v: string) => void;
    linkedinUrl: string; setLinkedinUrl: (v: string) => void;
    resumeFile: File | null; setResumeFile: (f: File | null) => void;
    uploading: boolean;
    uploadedUrl: string | null;
    draftFileName: string | null;
    onClearResume: () => void;
}

function StepThree({
    githubUrl, setGithubUrl, portfolioUrl, setPortfolioUrl, linkedinUrl, setLinkedinUrl,
    resumeFile, setResumeFile, uploading, uploadedUrl, draftFileName, onClearResume,
}: S3Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);
    const [fileErr, setFileErr] = useState("");

    function handleFile(file: File) {
        setFileErr("");
        if (!ACCEPTED_MIME.includes(file.type)) {
            setFileErr("Only PDF or Word (.doc, .docx) files are accepted.");
            return;
        }
        if (file.size > MAX_BYTES) {
            setFileErr(`File is too large (${(file.size / 1048576).toFixed(1)} MB). Max is 5 MB.`);
            return;
        }
        setResumeFile(file);
    }

    const displayName = resumeFile?.name ?? draftFileName;
    const isReady = !!(resumeFile || uploadedUrl || draftFileName);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* ── Resume ── */}
            <div>
                <FieldLabel required>Resume / CV</FieldLabel>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 8px" }}>
                    PDF or Word document · max 5 MB
                </p>

                {isReady ? (
                    /* File chosen */
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderRadius: 9,
                        border: "0.5px solid rgba(34,197,94,0.35)",
                        background: "rgba(34,197,94,0.05)",
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontSize: 12, color: "var(--text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {displayName}
                            {uploadedUrl && <span style={{ fontSize: 10, color: "#22c55e", marginLeft: 8 }}>✓ Uploaded</span>}
                            {uploading && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8 }}>Uploading…</span>}
                        </span>
                        {!uploading && (
                            <button type="button" onClick={onClearResume} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex", flexShrink: 0 }}>
                                <CloseIcon size={13} />
                            </button>
                        )}
                    </div>
                ) : (
                    /* Drop zone */
                    <div
                        onDragOver={e => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                        onClick={() => fileRef.current?.click()}
                        style={{
                            border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: 10, padding: "24px 16px", textAlign: "center",
                            background: drag ? "rgba(55,138,221,0.04)" : "transparent",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                                stroke={drag ? "var(--accent)" : "var(--muted)"}
                                strokeWidth="1.5" strokeLinecap="round" style={{ transition: "stroke 0.15s" }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                                    Drag & drop or{" "}
                                    <span style={{ color: "var(--accent)" }}>browse files</span>
                                </p>
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                                    PDF, DOC, DOCX — max 5 MB
                                </p>
                            </div>
                        </div>
                        <input
                            ref={fileRef} type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                            style={{ display: "none" }}
                        />
                    </div>
                )}

                {fileErr && <p style={{ fontSize: 11, color: "#e24b4a", margin: "6px 0 0" }}>{fileErr}</p>}
            </div>

            {/* ── Divider ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
                <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Profile links</span>
                <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
            </div>

            {/* GitHub required */}
            <LinkField
                label="GitHub" required icon={<GithubIcon />}
                value={githubUrl} onChange={setGithubUrl}
                placeholder="https://github.com/username"
                validate={v => v && !isGithubUrl(v) ? "Must be a valid github.com profile URL" : null}
            />

            {/* Optional */}
            <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0" }}>
                Optional
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: -8 }}>
                <LinkField
                    label="Portfolio" icon={<PortfolioIcon />}
                    value={portfolioUrl} onChange={setPortfolioUrl}
                    placeholder="https://yoursite.com"
                    validate={v => v && !isValidUrl(v) ? "Must be a valid URL (https://…)" : null}
                />
                <LinkField
                    label="LinkedIn" icon={<LinkedinIcon />}
                    value={linkedinUrl} onChange={setLinkedinUrl}
                    placeholder="https://linkedin.com/in/username"
                    validate={v => v && !isValidUrl(v) ? "Must be a valid URL (https://…)" : null}
                />
            </div>
        </div>
    );
}

// ─── Link field with blur validation ─────────────────────────────────────────

function LinkField({ label, required, icon, value, onChange, placeholder, validate }: {
    label: string; required?: boolean; icon: React.ReactNode;
    value: string; onChange: (v: string) => void; placeholder: string;
    validate?: (v: string) => string | null;
}) {
    const [touched, setTouched] = useState(false);
    const inlineErr = touched && validate ? validate(value) : null;

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {icon}
                <FieldLabel required={required}>{label}</FieldLabel>
            </div>
            <input
                type="url" value={value}
                onChange={e => onChange(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={placeholder}
                style={{ ...inputBase, borderColor: inlineErr ? "rgba(226,75,74,0.6)" : undefined }}
            />
            {inlineErr && <p style={{ fontSize: 10, color: "#e24b4a", margin: "4px 0 0" }}>{inlineErr}</p>}
        </div>
    );
}

// ─── Micro components ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
            {children}{required && <span style={{ color: "#e24b4a" }}>*</span>}
        </span>
    );
}

function Opt() {
    return <span style={{ fontSize: 10, color: "var(--muted)", opacity: 0.55, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional</span>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function JoinIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>; }
function SaveIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>; }
function CloseIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function BackIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function NextIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function SendIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>; }
function AlertIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
function InfoIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
function SpinnerIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}><path d="M12 2a10 10 0 0 1 10 10" /></svg>; }
function GithubIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>; }
function PortfolioIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>; }
function LinkedinIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>; }