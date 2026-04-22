import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/path";
import Link from "next/link";

export default async function LearnPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });
    if (!onboarding) redirect("/onboarding");

    const progress = await prisma.userProgress.findMany({
        where: { userId: session.user.id, pathId: onboarding.pathId },
    });

    const path = PATHS[onboarding.pathId];
    const completedIndexes = new Set(progress.map(p => p.moduleIndex));

    const completedCount = completedIndexes.size;
    const total = path.modules.length;
    const percent = Math.round((completedCount / total) * 100);

    return (
        <div className="max-w-6xl mx-auto p-5 grid gap-6 lg:grid-cols-[2fr_1fr]">

            {/* LEFT — MODULES */}
            <div>
                <div className="mb-6">
                    <div className="w-7 h-[2px] bg-[var(--accent)] mb-4" />
                    <h1 className="text-xl font-medium text-[var(--text)]">
                        {path.label}
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                        {completedCount} of {total} modules complete
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {path.modules.map((mod, i) => {
                        const done = completedIndexes.has(i);
                        const locked = i > completedCount;

                        return (
                            <Link
                                key={i}
                                href={locked ? "#" : `/learn/${onboarding.pathId}-${i}`}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl border transition
                                    ${done ? "border-[var(--accent)]" : "border-[var(--border)]"}
                                    ${locked ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--accent)]"}
                                    bg-[var(--surface)]
                                `}
                            >
                                {/* Circle */}
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                                    ${done ? "bg-[var(--accent)] text-[var(--bg)]" : "bg-[var(--surface2)] text-[var(--muted)]"}
                                `}>
                                    {done ? "✓" : i + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--text)]">
                                        {mod.title}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {mod.sub}
                                    </p>
                                </div>

                                {/* Right */}
                                <div className="text-right text-xs">
                                    <div className="px-2 py-[2px] rounded bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] mb-1">
                                        {mod.duration}
                                    </div>

                                    {done && <p className="text-[var(--muted)]">Done</p>}
                                    {!done && !locked && <p className="text-[var(--text)]">Start →</p>}
                                    {locked && <p className="text-[var(--muted)]">Locked</p>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT — SMART PANEL */}
            <div className="flex flex-col gap-4">

                {/* Progress Card */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">Progress</p>

                    <div className="h-1 bg-[var(--border)] rounded mb-3">
                        <div
                            className="h-1 bg-[var(--accent)] rounded"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <p className="text-xs text-[var(--muted)]">
                        {percent}% completed
                    </p>
                </div>

                {/* Resume */}
                {completedCount < total && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                        <p className="text-sm font-medium mb-3">Continue learning</p>

                        <Link
                            href={`/learn/${onboarding.pathId}-${completedCount}`}
                            className="
                                    group flex items-center justify-between
                                    px-4 py-2.5 rounded-lg
                                    bg-[var(--accent)] text-[var(--bg)]
                                    text-sm font-medium
                                    transition-all duration-200
                                    hover:opacity-90 active:scale-[0.98]
                                "
                        >
                            <span>Resume Module {completedCount + 1}</span>

                            <svg
                                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Tip Section */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">Tip</p>
                    <p className="text-xs text-[var(--muted)]">
                        Consistency beats intensity. Finish 1 module daily.
                    </p>
                </div>

            </div>
        </div>
    );
}