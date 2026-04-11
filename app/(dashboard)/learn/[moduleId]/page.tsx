import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PATHS } from "@/lib/path";
import Link from "next/link";
import ModuleActions from "./ModuleActions";

export default async function ModulePage({
    params,
}: {
    params: Promise <{ moduleId: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { moduleId } = await params;
    const moduleIndex = parseInt(moduleId);

    if (isNaN(moduleIndex)) notFound();

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });
    if (!onboarding) redirect("/onboarding");

    const path = PATHS[onboarding.pathId];
    const mod = path?.modules[moduleIndex];
    if (!mod) notFound();

    const progress = await prisma.userProgress.findMany({
        where: { userId: session.user.id, pathId: onboarding.pathId },
    });

    const completedIndexes = new Set(progress.map(p => p.moduleIndex));
    const isDone = completedIndexes.has(moduleIndex);
    const isLocked = moduleIndex > completedIndexes.size;
    const nextIndex = moduleIndex + 1 < path.modules.length ? moduleIndex + 1 : null;
    const prevIndex = moduleIndex > 0 ? moduleIndex - 1 : null;

    if (isLocked) redirect("/learn");

    return (
        <div style={{ maxWidth: "680px" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2rem" }}>
                <Link href="/learn" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>
                    {path.label}
                </Link>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>→</span>
                <span style={{ fontSize: "12px", color: "var(--text)" }}>
                    Module {moduleIndex + 1}
                </span>
            </div>

            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{
                        fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                        background: "var(--surface2)", border: "0.5px solid var(--border)",
                        color: "var(--muted)",
                    }}>
                        {mod.duration}
                    </span>
                    {isDone && (
                        <span style={{
                            fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                            border: "0.5px solid var(--accent)", color: "var(--text)",
                        }}>
                            Completed
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: "24px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                    {mod.title}
                </h1>
                <p style={{ fontSize: "14px", color: "var(--muted)" }}>{mod.sub}</p>
            </div>

            {/* Content card */}
            <div style={{
                border: "0.5px solid var(--border)", borderRadius: "11px",
                background: "var(--surface)", overflow: "hidden", marginBottom: "1.5rem",
            }}>
                <div style={{ padding: "1.5rem", borderBottom: "0.5px solid var(--border)" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "1rem" }}>
                        What you&apos;ll learn
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {getModuleObjectives(mod.title).map((obj, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                <div style={{
                                    width: "5px", height: "5px", borderRadius: "50%",
                                    background: "var(--accent)", marginTop: "6px", flexShrink: 0,
                                }} />
                                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{obj}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: "1.5rem" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "1rem" }}>
                        Resources
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {getModuleResources(mod.title).map((res, i) => (
                            <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 12px", borderRadius: "8px",
                                border: "0.5px solid var(--border)", background: "var(--surface2)",
                                textDecoration: "none", transition: "border-color 0.15s",
                            }}>
                                <div>
                                    <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "2px" }}>{res.title}</p>
                                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>{res.type}</p>
                                </div>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions — mark complete + navigation */}
            <ModuleActions
                moduleIndex={moduleIndex}
                pathId={onboarding.pathId}
                isDone={isDone}
                nextIndex={nextIndex}
                prevIndex={prevIndex}
            />
        </div>
    );
}

function getModuleObjectives(title: string): string[] {
    const map: Record<string, string[]> = {
        "How auth works": ["Understand the difference between sessions and JWT tokens", "Learn how cookies store authentication state", "See how OAuth delegates login to third parties"],
        "NextAuth setup": ["Install and configure NextAuth in a Next.js project", "Set up the [...nextauth] route handler", "Configure providers, adapter, and secret"],
        "OAuth flow": ["Register OAuth apps on GitHub and Google", "Handle callback URLs and access tokens", "Store OAuth account data with Prisma adapter"],
        "Credentials auth": ["Build email and password login from scratch", "Hash passwords securely with bcrypt", "Validate credentials in the NextAuth authorize callback"],
        "Protected routes": ["Use Next.js middleware to guard routes", "Read session tokens server-side and client-side", "Redirect unauthenticated users correctly"],
        "Deploy securely": ["Set environment variables in Vercel", "Understand which secrets must never be public", "Configure NEXTAUTH_URL for production"],
        "Git fundamentals": ["Initialize a repo and understand the working tree", "Stage and commit changes with meaningful messages", "View history with git log and compare with git diff"],
        "Branching & merging": ["Create and switch branches for features and fixes", "Merge branches and resolve conflicts", "Understand rebase vs merge"],
        "GitHub workflow": ["Fork a repository and clone it locally", "Connect local repo to a remote origin", "Push branches and sync with upstream"],
        "Pull requests": ["Open a PR with a clear description", "Respond to code review feedback", "Understand what makes a good PR"],
        "Find issues": ["Search for good-first-issue labels on GitHub", "Read issue templates and contribution guides", "Understand how maintainers triage issues"],
        "Your first PR": ["Pick a real open source issue to fix", "Make the change, test it, and open a PR", "Handle review feedback and get merged"],
    };
    return map[title] ?? ["Understand the core concepts", "Apply them in a real project", "Know when and why to use this"];
}

function getModuleResources(title: string): { title: string; url: string; type: string }[] {
    const map: Record<string, { title: string; url: string; type: string }[]> = {
        "How auth works": [
            { title: "HTTP cookies explained", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", type: "MDN Docs" },
            { title: "JWT introduction", url: "https://jwt.io/introduction", type: "Official guide" },
        ],
        "NextAuth setup": [
            { title: "NextAuth.js documentation", url: "https://next-auth.js.org/getting-started/introduction", type: "Official docs" },
            { title: "App Router setup guide", url: "https://next-auth.js.org/configuration/initialization#route-handlers-app-router", type: "Official docs" },
        ],
        "Git fundamentals": [
            { title: "Git official documentation", url: "https://git-scm.com/doc", type: "Official docs" },
            { title: "Pro Git book (free)", url: "https://git-scm.com/book/en/v2", type: "Free book" },
        ],
        "Branching & merging": [
            { title: "Git branching — Atlassian", url: "https://www.atlassian.com/git/tutorials/using-branches", type: "Tutorial" },
            { title: "Merge vs rebase", url: "https://www.atlassian.com/git/tutorials/merging-vs-rebasing", type: "Tutorial" },
        ],
    };
    return map[title] ?? [
        { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "Reference" },
        { title: "Official documentation", url: "https://docs.github.com", type: "Official docs" },
    ];
}