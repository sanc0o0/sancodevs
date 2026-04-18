import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/path";
import Link from "next/link";
import CompletionActions from "./CompletionActions";

export default async function CompletePage({
    searchParams,
}: {
    searchParams: Promise<{ path?: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { path: pathId } = await searchParams;
    const path = pathId ? PATHS[pathId] : null;

    return (
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
            <div className="text-5xl mb-6">🎉</div>
            <div className="w-7 h-0.5 bg-[var(--accent)] mx-auto mb-5" />
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-3">
                Path complete
            </h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
                You&apos;ve finished{" "}
                <strong className="text-[var(--text)]">{path?.label ?? "your learning path"}</strong>.
                Now it&apos;s time to build.
            </p>

            <div className="grid gap-3 mb-8">
                <Link
                    href="/projects/new"
                    className="flex items-center justify-between px-5 py-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] hover:border-[var(--accent)] transition-colors no-underline group"
                >
                    <div className="text-left">
                        <p className="text-sm font-medium text-[var(--text)] mb-0.5">Create a project</p>
                        <p className="text-xs text-[var(--muted)]">Apply what you learned by building something real</p>
                    </div>
                    <span className="text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">→</span>
                </Link>

                <Link
                    href="/projects"
                    className="flex items-center justify-between px-5 py-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)] transition-colors no-underline group"
                >
                    <div className="text-left">
                        <p className="text-sm font-medium text-[var(--text)] mb-0.5">Join a project</p>
                        <p className="text-xs text-[var(--muted)]">Collaborate with other developers</p>
                    </div>
                    <span className="text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">→</span>
                </Link>
            </div>

            <CompletionActions pathLabel={path?.label ?? "Developer path"} />
        </div>
    );
}