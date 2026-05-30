"use client";

import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";
import AddFriendButton from "@/app/(dashboard)/user/[userId]/AddFriendButton";
import BlockButton from "@/app/(dashboard)/user/[userId]/BlockButton";
import ProfileTabs from "./ProfileTabs";
import ProfileTabContent from "./ProfileTabContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export interface ProfileIdentity {
    subjectId: string;
    viewerId: string;
    isOwner: boolean;
    viewerHasBlocked: boolean;
    name: string;
    username: string;
    email: string;
    image: string | null;
    bannerImage: string | null;
    bio: string | null;
    reliabilityScore: number | null;
    builderScore: number;
    role: string | null;
    domain: string | null;
    experienceLevel: string | null;
    availability: string | null;
    mission: string | null;
    goals: string[];
    prefTechs: string[];
    prefTopics: string[];
    cardProjects: Array<{ id: string; title: string; status: string; role: string }>;
    totalTerminal: number;
    stats: { tasksCompleted: number; tasksMissed: number } | null;
    teamCount: number;
}

function SideSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "0.5px solid var(--border)" }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    {label}
                </p>
            </div>
            <div style={{ padding: "14px 16px" }}>{children}</div>
        </div>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)" }}>
            {label}
        </span>
    );
}

function ShellInner({ identity }: { identity: ProfileIdentity }) {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";

    const {
        subjectId, isOwner, viewerHasBlocked,
        name, username, email, image, bannerImage, bio,
        reliabilityScore, builderScore,
        role, domain, experienceLevel, availability,
        prefTechs, prefTopics, cardProjects,
        totalTerminal, stats, teamCount, goals,
    } = identity;

    return (
        <>
            <style>{`
        .ps-wrap {
          width: 100%;
          padding: 20px 16px 60px;
          box-sizing: border-box;
        }
        .ps-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 16px;
          align-items: start;
        }
        .ps-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
          /* Sticky: top offset = navbar height (64px) + desired gap (12px) */
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 24px);
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ps-left::-webkit-scrollbar { display: none; }
        .ps-right {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }
        @media (max-width: 880px) {
          .ps-grid { grid-template-columns: 1fr; }
          .ps-left { position: static; max-height: none; overflow-y: visible; }
        }
      `}</style>

            <div className="ps-wrap">
                <div className="ps-grid">

                    {/* ══ LEFT SIDEBAR ══ */}
                    <div className="ps-left">
                        <ProfileCard
                            name={name}
                            username={username}
                            email={email}
                            image={image}
                            bannerImage={bannerImage}
                            bio={bio}
                            role={role}
                            domain={domain}
                            experienceLevel={experienceLevel}
                            availability={availability}
                            mission={null}
                            prefTechs={prefTechs}
                            prefTopics={prefTopics}
                            projects={cardProjects}
                            reliabilityScore={reliabilityScore}
                            builderScore={builderScore}
                            isOwner={isOwner}
                        />

                        {!isOwner && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <AddFriendButton targetUserId={subjectId} />
                                <BlockButton targetUserId={subjectId} isBlocked={viewerHasBlocked} />
                            </div>
                        )}

                        <SideSection label="Builder identity">
                            {goals.length > 0 || role || domain ? (
                                <>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {[
                                            { text: domain, strong: true },
                                            { text: role, strong: true },
                                            { text: experienceLevel ? experienceLevel.charAt(0) + experienceLevel.slice(1).toLowerCase() : null, strong: false },
                                            { text: availability, strong: false },
                                            ...goals.map((g) => ({ text: g.replace(/_/g, " "), strong: false })),
                                        ]
                                            .filter((x) => x.text)
                                            .map((x, i) => (
                                                <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", color: x.strong ? "var(--text)" : "var(--muted)", background: x.strong ? "var(--surface2)" : "transparent", textTransform: "capitalize" }}>
                                                    {x.text}
                                                </span>
                                            ))}
                                    </div>
                                    {isOwner && (
                                        <div style={{ marginTop: 10 }}>
                                            <Link href="/onboarding" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }}>
                                                Update onboarding →
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : isOwner ? (
                                <div>
                                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Complete onboarding to set your builder identity.</p>
                                    <Link href="/onboarding" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>Complete setup →</Link>
                                </div>
                            ) : (
                                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>No identity set yet.</p>
                            )}
                        </SideSection>

                        <SideSection label="Achievements">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {totalTerminal >= 1 && <Badge label="First task" />}
                                {(stats?.tasksCompleted ?? 0) >= 10 && <Badge label="10 tasks done" />}
                                {(stats?.tasksCompleted ?? 0) >= 30 && <Badge label="30 tasks done" />}
                                {(stats?.tasksMissed ?? 0) === 0 && totalTerminal >= 5 && <Badge label="Zero missed" />}
                                {(reliabilityScore ?? 0) >= 90 && totalTerminal >= 5 && <Badge label="Top performer" />}
                                {teamCount >= 3 && <Badge label="Multi-project" />}
                                {totalTerminal === 0 && (
                                    <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                        {isOwner ? "Complete tasks to earn badges." : "No achievements yet."}
                                    </p>
                                )}
                            </div>
                            <div style={{ marginTop: 10, padding: "7px 10px", borderRadius: 7, border: "0.5px dashed var(--border)", background: "var(--surface2)" }}>
                                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                                    View all →
                                    <button
                                        onClick={() => {
                                            const url = new URL(window.location.href);
                                            url.searchParams.set("tab", "achievements");
                                            window.history.pushState({}, "", url.toString());
                                            window.dispatchEvent(new PopStateEvent("popstate"));
                                        }}
                                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 10, padding: 0, marginLeft: 4 }}
                                    >
                                        Achievements tab
                                    </button>
                                </p>
                            </div>
                        </SideSection>
                    </div>

                    {/* ══ RIGHT CONTENT ══ */}
                    <div className="ps-right">
                        <ProfileTabs activeTab={activeTab} isOwner={isOwner} username={username} />
                        <div style={{ marginTop: 16 }}>
                            <ProfileTabContent
                                activeTab={activeTab}
                                subjectId={subjectId}
                                isOwner={isOwner}
                                username={username}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default function ProfileShell({ identity }: { identity: ProfileIdentity }) {
    return (
        <Suspense fallback={<ShellSkeleton />}>
            <ShellInner identity={identity} />
        </Suspense>
    );
}

function ShellSkeleton() {
    return (
        <div style={{ padding: "20px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
                <div style={{ height: 400, borderRadius: 12, background: "var(--surface)", border: "0.5px solid var(--border)" }} />
                <div style={{ height: 400, borderRadius: 12, background: "var(--surface)", border: "0.5px solid var(--border)" }} />
            </div>
        </div>
    );
}