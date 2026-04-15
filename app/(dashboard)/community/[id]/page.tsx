import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ChatWindow from "./ChatWindow";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { id } = await params;

    const group = await prisma.communityGroup.findUnique({
        where: { id },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, image: true } } },
            },
            messages: {
                include: { user: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: "asc" },
                take: 100,
            },
        },
    });

    if (!group) notFound();

    const isMember = group.members.some(m => m.userId === session.user.id);
    if (!isMember) redirect("/community");

    return (
        <div style={{
            display: "flex", flexDirection: "column",
            height: "calc(100vh - 54px)",
            maxWidth: "900px", width: "100%",
        }}>
            {/* Header */}
            <div style={{
                flexShrink: 0, padding: "0 0 1rem",
                borderBottom: "0.5px solid var(--border)",
                marginBottom: "0",
            }}>
                <Link href="/community" style={{
                    fontSize: "12px", color: "var(--muted)",
                    textDecoration: "none", display: "block", marginBottom: "8px",
                }}>
                    ← Community
                </Link>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                        <h1 style={{ fontSize: "18px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>
                            {group.name}
                        </h1>
                        {group.description && (
                            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "3px" }}>{group.description}</p>
                        )}
                        <p style={{ fontSize: "12px", color: "var(--muted)" }}>{group.members.length} members</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {group.members.slice(0, 5).map((m, i) => (
                            <div key={m.id} title={m.user.name ?? ""} style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: "var(--surface2)", border: "2px solid var(--bg)",
                                overflow: "hidden", marginLeft: i === 0 ? 0 : "-8px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "10px", color: "var(--text)", flexShrink: 0,
                            }}>
                                {m.user.image
                                    ? <img src={m.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : m.user.name?.charAt(0)
                                }
                            </div>
                        ))}
                        {group.members.length > 5 && (
                            <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "8px" }}>
                                +{group.members.length - 5}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Client chat window */}
            <ChatWindow
                groupId={group.id}
                initialMessages={group.messages.map(m => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.createdAt.toISOString(),
                    userId: m.userId,
                    user: m.user,
                    reactions: [],
                }))}
                currentUserId={session.user.id}
                currentUserName={session.user.name ?? ""}
                currentUserImage={session.user.image ?? null}
            />
        </div>
    );
}