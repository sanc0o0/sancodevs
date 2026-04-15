import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateGroupButton from "./CreateGroupButton";

export default async function CommunityPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const groups = await prisma.communityGroup.findMany({
        where: {
            members: { some: { userId: session.user.id } },
        },
        include: {
            _count: { select: { members: true, messages: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });

    const allGroups = await prisma.communityGroup.findMany({
        where: {
            members: { none: { userId: session.user.id } },
        },
        include: { _count: { select: { members: true } } },
        take: 10,
        orderBy: { createdAt: "desc" },
    });

    return (
        <div style={{ maxWidth: "780px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>Community</h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Discuss problems, share projects, and help each other grow.
                    </p>
                </div>
                <CreateGroupButton />
            </div>

            {groups.length > 0 && (
                <>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                        Your groups
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "2rem" }}>
                        {groups.map(g => (
                            <Link key={g.id} href={`/community/${g.id}`} style={{
                                display: "block", padding: "1rem 1.375rem", borderRadius: "10px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                textDecoration: "none", transition: "border-color 0.15s",
                            }}
                                className="card-hover"
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{g.name}</p>
                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{g._count.members} members</span>
                                </div>
                                {g.messages[0] && (
                                    <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                                        <strong style={{ color: "var(--text)", fontWeight: 500 }}>{g.messages[0].user.name}: </strong>
                                        {g.messages[0]?.content
                                            ? (
                                                <>
                                                    {g.messages[0].content.slice(0, 60)}
                                                    {g.messages[0].content.length > 60 ? "..." : ""}
                                                </>
                                            )
                                            : "No messages yet!"}
                                    </p>
                                )}
                                {!g.messages[0] && (
                                    <p style={{ fontSize: "12px", color: "var(--muted)" }}>No messages yet</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {allGroups.length > 0 && (
                <>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                        Discover groups
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {allGroups.map(g => (
                            <div key={g.id} style={{
                                padding: "1rem 1.375rem", borderRadius: "10px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
                            }}>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>{g.name}</p>
                                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>{g._count.members} members</p>
                                </div>
                                <JoinGroupButton groupId={g.id} groupName={g.name} />
                            </div>
                        ))}
                    </div>
                </>
            )}

            {groups.length === 0 && allGroups.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center", border: "0.5px solid var(--border)", borderRadius: "11px", background: "var(--surface)" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>No groups yet</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>Create the first one.</p>
                </div>
            )}
        </div>
    );
}

import JoinGroupButton from "./JoinGroupButton";