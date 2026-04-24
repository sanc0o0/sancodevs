"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GroupList from "./GroupList";
import ChatPane from "./ChatPane";
import DetailsPane from "./DetailsPane";
import { getPusherClient } from "@/lib/pusher-client";


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
    myDiscoverGroups: DiscoverGroup[];
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string | null;
    initialTab?: "chats" | "requests" | "discover";
}

export default function CommunityShell({
    myGroups,
    myRequests,
    myDiscoverGroups,
    currentUserId,
    currentUserName,
    currentUserImage,
}: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeGroupId, setActiveGroupId] = useState<string | null>(
        searchParams.get("groupId") ?? null
    );
    const [groups, setGroups] = useState<GroupSummary[]>(myGroups);
    const [memberRoles, setMemberRoles] = useState<Record<string, "ADMIN" | "MEMBER">>({});
    const [requests, setRequests] = useState<RequestSummary[]>(myRequests);
    const [discoverGroups, setDiscoverGroups] = useState(myDiscoverGroups);
    const [groupListTab, setGroupListTab] = useState<"chats" | "requests" | "discover">(
        (searchParams.get("tab") as "chats" | "requests" | "discover") ?? "chats"
    );
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const [detailsTab, setDetailsTab] = useState<"members" | "pending">(
        searchParams.get("tab") === "requests" && searchParams.get("groupId")
            ? "pending"
            : "members"
    );
    const [showDetails, setShowDetails] = useState(
        !!(searchParams.get("tab") === "requests" && searchParams.get("groupId"))
    );

    // separate effect ONLY for URL cleanup (no setState):
    useEffect(() => {
        const tab = searchParams.get("tab");
        const groupId = searchParams.get("groupId");
        if (tab || groupId) {
            router.replace("/community", { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount only — just cleans the URL
    

    //useEffect for group-level Pusher subscriptions:
    useEffect(() => {
        const pusher = getPusherClient();

        // Subscribe to all groups the user is in
        const channels = groups.map(g => {
            const channel = pusher.subscribe(`group-${g.id}`);

            channel.bind("message:new", (msg: { userId: string; groupId?: string }) => {
                const groupId = g.id;
                // Only count if not the active group and not from self
                if (groupId === activeGroupId) return;
                if (msg.userId === currentUserId) return;

                setUnreadCounts(prev => ({
                    ...prev,
                    [groupId]: Math.min((prev[groupId] ?? 0) + 1, 99),
                }));

                // Also update lastMessage preview in groups list
                setGroups(prev => prev.map(gr =>
                    gr.id === groupId
                        ? { ...gr, lastMessage: { senderName: null, content: null, createdAt: new Date().toISOString() } }
                        : gr
                ));
            });

            channel.bind("group:deleted", () => {
                // Group was deleted — handled by user channel above
                // Just unsubscribe
                pusher.unsubscribe(`group-${g.id}`);
            });

            return { groupId: g.id, channel };
        });

        return () => {
            channels.forEach(({ groupId }) => {
                pusher.unsubscribe(`group-${groupId}`);
            });
        };
    }, [groups.length, activeGroupId, currentUserId]);

    
    const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;
    useEffect(() => {
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`user-${currentUserId}`);
        
        channel.bind("group:deleted", ({ groupId }: { groupId: string }) => {
            // Remove from groups list immediately
            setGroups(prev => prev.filter(g => g.id !== groupId));
            // If currently viewing the deleted group, close it
            setActiveGroupId(prev => prev === groupId ? null : prev);
        });
        
        // When admin approves → move from requests to chats
        channel.bind("join:accepted", ({ groupId, groupName }: { groupId: string; groupName: string }) => {
            setRequests(prev => {
                const req = prev.find(r => r.groupId === groupId);
                if (req) {
                    // Add to groups
                    setGroups(g => [...g, {
                        id: req.groupId,
                        name: req.group.name,
                        description: req.group.description,
                        isPrivate: req.group.isPrivate,
                        memberCount: req.group.memberCount + 1,
                        muted: false,
                        pinned: false,
                        role: "MEMBER" as const,
                        lastMessage: null,
                    }]);
                }
                return prev.filter(r => r.groupId !== groupId);
            });
        });

        // When admin rejects → remove from requests, move back to discover if public
        channel.bind("join:rejected", ({ groupId, groupName }: { groupId: string; groupName: string }) => {
            setRequests(prev => {
                const req = prev.find(r => r.groupId === groupId);
                if (req && !req.group.isPrivate) {
                    // Move back to discover
                    setDiscoverGroups(d => {
                        if (d.some(g => g.id === groupId)) return d;
                        return [...d, {
                            id: req.groupId,
                            name: req.group.name,
                            description: req.group.description,
                            isPrivate: false,
                            memberCount: req.group.memberCount,
                        }];
                    });
                }
                return prev.filter(r => r.groupId !== groupId);
            });
        });
        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`user-${currentUserId}`);
        };
    }, [activeGroup, currentUserId]);
    
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

    // Clear unread when group is opened:
    function handleSelectGroup(id: string) {
        setActiveGroupId(id);
        setShowDetails(false);
        setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
    }

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

    function handleRequestResponded(groupId: string, moveToDiscover?: DiscoverGroup) {
        setRequests(prev => prev.filter(r => r.groupId !== groupId));
        if (moveToDiscover) {
            setDiscoverGroups(prev => {
                if (prev.some(g => g.id === moveToDiscover.id)) return prev;
                return [...prev, moveToDiscover]
            })
        }
    }

    return (
        <div
            style={{
                position: "fixed",
                top: "60px",    // navbar height
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
                    // onSelectGroup={id => { 
                    //     setActiveGroupId(id); 
                    //     setShowDetails(false); 
                    // }}
                    unreadCounts={unreadCounts}
                    onSelectGroup={handleSelectGroup}   //  new handler
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