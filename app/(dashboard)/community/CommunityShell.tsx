"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GroupList from "./GroupList";
import ChatPane from "./ChatPane";
import DetailsPane from "./DetailsPane";


type GroupSummary = {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    memberCount: number;
    muted: boolean;
    pinned: boolean;
    role: "ADMIN" | "MEMBER";
    lastMessage: {
        senderName: string | null;
        content: string | null;
        createdAt: string;
    } | null;
};

type DiscoverGroup = {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    memberCount: number;
};

type RequestSummary = {
    groupId: string;
    status: "PENDING" | "INVITED";
    group: { 
        id: string; 
        name: string; 
        description: string | null; 
        isPrivate: boolean; 
        memberCount: number 
    };
};

interface Props {
    myGroups: GroupSummary[];
    myRequests: RequestSummary[];
    discoverGroups: DiscoverGroup[];
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string | null;
    initialTab?: "chats" | "requests" | "discover";
}

export default function CommunityShell({
    myGroups,
    myRequests,
    discoverGroups,
    currentUserId,
    currentUserName,
    currentUserImage,
}: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeGroupId, setActiveGroupId] = useState<string | null>(
        searchParams.get("groupId") ?? myGroups[0]?.id ?? null
    );
    const [showDetails, setShowDetails] = useState(false);
    const [detailsTab, setDetailsTab] = useState<"members" | "pending">("members");
    const [groups, setGroups] = useState<GroupSummary[]>(myGroups);
    const [memberRoles, setMemberRoles] = useState<Record<string, "ADMIN" | "MEMBER">>({});
    const [requests, setRequests] = useState<RequestSummary[]>(myRequests);
    const [groupListTab, setGroupListTab] = useState<"chats" | "requests" | "discover">(
        (searchParams.get("tab") as "chats" | "requests" | "discover") ?? "chats"
    );
    useEffect(() => {
        const tab = searchParams.get("tab") as "chats" | "requests" | "discover" | null;
        const groupId = searchParams.get("groupId");

        if (tab) setGroupListTab(tab);

        if (groupId) {
            setActiveGroupId(groupId);
            if (tab === "requests") {
                setShowDetails(true);
                setDetailsTab("pending");
            }
        }

        if (tab || groupId) {
            router.replace("/community", { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        if (!activeGroupId) return;
        fetch(`/api/community/groups/${activeGroupId}/members`)
            .then(r => r.ok ? r.json() : [])
            .then((members: { userId: string; role: "ADMIN" | "MEMBER" }[]) => {
                const me = members.find(m => m.userId === currentUserId);
                if (me) {
                    setMemberRoles(prev => ({ ...prev, [activeGroupId]: me.role }));
                }
            })
            .catch(() => { });
    }, [activeGroupId, currentUserId]);

    const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;

    function handleGroupCreated(newGroup: GroupSummary) {
        setGroups(prev => [newGroup, ...prev]);
        setActiveGroupId(newGroup.id);
    }

    function handleGroupUpdated(id: string, updates: Partial<GroupSummary>) {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    }

    function handleGroupLeft(id: string) {
        // preserve role property so type stays GroupSummary[]
        setGroups(prev => prev.filter((g: GroupSummary) => g.id !== id));
        setActiveGroupId(prev => prev === id
            ? (groups.find(g => g.id !== id)?.id ?? null)
            : prev
        );
    }

    function handleRequestResponded(groupId: string) {
        setRequests(prev => prev.filter((r: RequestSummary) => r.groupId !== groupId));
    }

    // In CommunityShell.tsx — replace the return:
    return (
        <div
            style={{
                position: "fixed",
                top: "54px",    // navbar height
                left: "200px",  // sidebar width — 0 on mobile
                right: 0,
                bottom: 0,
                display: "flex",
                overflow: "hidden",
            }}
            className="community-root"
        >
            {/* Panel 1 — Group list */}
            <div className={`
                flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg)] flex flex-col
                /* Desktop: always show */
                md:w-[300px] md:flex
                /* Mobile: full screen, hide when chat open */
                ${activeGroupId ? "hidden md:flex" : "flex w-full"}
            `}>
                <GroupList
                    groups={groups}
                    requests={requests}
                    discoverGroups={discoverGroups}
                    activeGroupId={activeGroupId}
                    onSelectGroup={id => { 
                        setActiveGroupId(id); 
                        setShowDetails(false); 
                    }}
                    onGroupCreated={handleGroupCreated}
                    onRequestResponded={handleRequestResponded}
                    currentUserId={currentUserId}
                    initialTab={groupListTab}
                />
            </div>

            {/* Panel 2 — Chat (full screen on mobile when open) */}
            {activeGroup ? (
                <div className={`
                    flex flex-col min-w-0 h-full relative
                    /* Desktop */
                    md:flex-1
                    /* Mobile: full screen */
                    ${showDetails ? "hidden lg:flex" : "flex"} w-full md:w-auto
                `}>
                    <ChatPane
                        group={activeGroup}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserImage={currentUserImage}
                        onOpenDetails={() => setShowDetails(true)}
                        onBack={() => setActiveGroupId(null)}
                    />
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-[var(--bg)]">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text)] mb-1">Your messages</p>
                        <p className="text-xs text-[var(--muted)]">Select a conversation to start chatting</p>
                    </div>
                </div>
            )}

            {/* Panel 3 — Details (slide in from right) */}
            {showDetails && activeGroup && (
                <>
                    {/* Mobile overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setShowDetails(false)}
                    />
                    <div className={`
                        bg-[var(--bg)] border-l border-[var(--border)] h-full overflow-y-auto
                        /* Mobile: fixed overlay */
                        fixed right-0 top-0 bottom-0 w-[280px] z-40
                        /* Desktop: inline panel */
                        lg:relative lg:z-auto lg:w-[280px] lg:flex-shrink-0
                    `} style={{ animation: "slideDown 0.2s ease" }}>
                        <DetailsPane
                            group={activeGroup}
                            currentUserId={currentUserId}
                            isAdmin={memberRoles[activeGroup.id] === "ADMIN"}
                            onClose={() => setShowDetails(false)}
                            onGroupUpdated={updates => handleGroupUpdated(activeGroup.id, updates)}
                            onGroupLeft={() => handleGroupLeft(activeGroup.id)}
                            initialTab={detailsTab}
                        />
                    </div>
                </>
            )}
        </div>
    );
}