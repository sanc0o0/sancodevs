// ─── Workspace shared types ───────────────────────────────────
// Used across all workspace tab components.

export interface WsMilestone {
    id: string;
    title: string;
}

export interface WsProjectCounts {
    applicants: number;
    teams: number;
    tasks: number;
}

/** Minimal project shape used in the Created tab (server-fetched) */
export interface WsCreatedProject {
    id: string;
    title: string;
    tagline: string | null;
    status: string;
    phase: string;
    domain: string | null;
    hiringOpen: boolean;
    updatedAt: string | Date;
    _count: WsProjectCounts;
    milestones: WsMilestone[];
}

/** Minimal project shape nested inside a team membership */
export interface WsJoinedProjectInner {
    id: string;
    title: string;
    tagline: string | null;
    phase: string;
    status: string;
    domain: string | null;
    updatedAt: string | Date;
    _count: { tasks: number };
}

export interface WsMembership {
    id: string;
    role: string;
    permissionLevel: string;
    joinedAt: string | Date;
    project: WsJoinedProjectInner;
}

/** Minimal project shape nested inside an application */
export interface WsApplicationProject {
    id: string;
    title: string;
    domain: string | null;
    phase: string;
    status: string;
    coverImage: string | null;
}

export interface WsApplication {
    id: string;
    status: string;
    desiredRole: string | null;
    createdAt: string | Date;
    reviewedAt: string | Date | null;
    project: WsApplicationProject;
}

/** Minimal project shape nested inside a saved record */
export interface WsSavedProjectInner {
    id: string;
    title: string;
    tagline: string | null;
    domain: string | null;
    phase: string;
    status: string;
    difficulty: string;
    hiringOpen: boolean;
    techStack: string[];
    _count: { teams: number };
}

export interface WsSavedEntry {
    id: string;
    savedAt: string | Date;
    project: WsSavedProjectInner;
}

export interface WsTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string | null;
    dueDate: string | Date | null;
    estimatedHours: number | null;
    updatedAt: string | Date;
    project: { id: string; title: string };
    milestone: { id: string; title: string } | null;
}

export interface WsNotification {
    id: string;
    title: string;
    body: string;
    href: string | null;
    read: boolean;
    createdAt: string | Date;
}

export interface WsArchivedProject {
    id: string;
    title: string;
    tagline: string | null;
    domain: string | null;
    updatedAt: string | Date;
    _count: { teams: number };
}

export interface WsArchivedMembership {
    id: string;
    role: string;
    joinedAt: string | Date;
    project: {
        id: string;
        title: string;
        tagline: string | null;
        domain: string | null;
        updatedAt: string | Date;
    };
}

export interface WsArchivedData {
    archivedCreated: WsArchivedProject[];
    archivedJoined: WsArchivedMembership[];
}