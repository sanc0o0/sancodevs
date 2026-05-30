import type {
    AchievementDefinition,
    AchievementRarity,
    AchievementTheme,
} from "./achievements.types";

// ─── Full achievement catalog ─────────────────────────────────────────────────
// This is the CLIENT-SIDE reference catalog used for display only.
// Server never trusts this list for unlock logic — it re-validates independently.

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
    // ── Onboarding ──────────────────────────────────────────────────────────────
    {
        key: "PROFILE_COMPLETED",
        title: "Profile Completed",
        description: "Set up your builder identity on Sancodevs.",
        icon: "✦",
        rarity: "COMMON",
        theme: "onboarding",
        points: 10,
        howToEarn: "Complete the onboarding flow and fill in your role, domain, and availability.",
    },

    // ── Projects ─────────────────────────────────────────────────────────────────
    {
        key: "FIRST_PROJECT",
        title: "First Project",
        description: "Joined your first project on Sancodevs.",
        icon: "◈",
        rarity: "COMMON",
        theme: "projects",
        points: 20,
        howToEarn: "Join any project on the platform as a team member.",
    },
    {
        key: "PROJECT_OWNER",
        title: "Project Owner",
        description: "Created and launched your own project.",
        icon: "⬡",
        rarity: "UNCOMMON",
        theme: "projects",
        points: 40,
        howToEarn: "Create a project and set it to OPEN or ACTIVE status.",
    },
    {
        key: "JOINED_5_PROJECTS",
        title: "Multi-Builder",
        description: "Contributed to 5 different projects.",
        icon: "⟡",
        rarity: "RARE",
        theme: "projects",
        points: 60,
        howToEarn: "Join and actively participate in 5 separate projects.",
    },
    {
        key: "BUILT_FIRST_TEAM",
        title: "Team Founder",
        description: "Built a team of at least 3 contributors.",
        icon: "⬢",
        rarity: "UNCOMMON",
        theme: "projects",
        points: 50,
        howToEarn: "Accept at least 3 applications into your project.",
    },
    {
        key: "LONG_TERM_CONTRIBUTOR",
        title: "Long-Term Contributor",
        description: "Stayed active on a project for 3+ months.",
        icon: "⌬",
        rarity: "RARE",
        theme: "projects",
        points: 75,
        howToEarn: "Remain an active team member on a single project for 90+ days.",
    },

    // ── Contributions ─────────────────────────────────────────────────────────────
    {
        key: "FIRST_TASK",
        title: "First Task",
        description: "Completed your first assigned task.",
        icon: "✓",
        rarity: "COMMON",
        theme: "contributions",
        points: 15,
        howToEarn: "Complete any task assigned to you.",
    },
    {
        key: "TASKS_10",
        title: "10 Tasks Done",
        description: "Completed 10 tasks across all projects.",
        icon: "◉",
        rarity: "UNCOMMON",
        theme: "contributions",
        points: 30,
        howToEarn: "Complete a total of 10 tasks.",
    },
    {
        key: "TASKS_30",
        title: "30 Tasks Done",
        description: "Completed 30 tasks — a true contributor.",
        icon: "◎",
        rarity: "RARE",
        theme: "contributions",
        points: 60,
        howToEarn: "Complete a total of 30 tasks.",
    },
    {
        key: "TASKS_100",
        title: "100 Tasks Done",
        description: "100 tasks completed. Legendary output.",
        icon: "⬛",
        rarity: "EPIC",
        theme: "contributions",
        points: 120,
        howToEarn: "Complete a total of 100 tasks.",
    },
    {
        key: "ZERO_MISS_STREAK",
        title: "Zero Miss Streak",
        description: "Completed 10+ tasks without missing a single deadline.",
        icon: "◇",
        rarity: "RARE",
        theme: "contributions",
        points: 80,
        howToEarn: "Complete 10 tasks in a row without any missed deadlines.",
    },
    {
        key: "DEADLINE_CRUSHER",
        title: "Deadline Crusher",
        description: "90%+ on-time rate across at least 20 tasks.",
        icon: "⚡",
        rarity: "EPIC",
        theme: "contributions",
        points: 100,
        howToEarn: "Achieve a 90% or higher on-time completion rate with at least 20 tasks.",
    },

    // ── Community ─────────────────────────────────────────────────────────────────
    {
        key: "FIRST_FRIEND",
        title: "First Connection",
        description: "Made your first friend on Sancodevs.",
        icon: "◌",
        rarity: "COMMON",
        theme: "community",
        points: 10,
        howToEarn: "Add someone as a friend and have them accept.",
    },
    {
        key: "FIRST_POST",
        title: "First Message",
        description: "Sent your first message in a community group.",
        icon: "◯",
        rarity: "COMMON",
        theme: "community",
        points: 10,
        howToEarn: "Send a message in any community group.",
    },
    {
        key: "HELPFUL_BUILDER",
        title: "Helpful Builder",
        description: "Recognized as helpful by 3+ teammates.",
        icon: "△",
        rarity: "UNCOMMON",
        theme: "community",
        points: 40,
        howToEarn: "Receive positive peer recognition from 3 different teammates.",
    },
    {
        key: "COMMUNITY_CONTRIBUTOR",
        title: "Community Contributor",
        description: "Active across multiple community groups.",
        icon: "▷",
        rarity: "UNCOMMON",
        theme: "community",
        points: 35,
        howToEarn: "Participate actively in 3 or more community groups.",
    },

    // ── Reputation ─────────────────────────────────────────────────────────────────
    {
        key: "AWESOME_TEAMMATE",
        title: "Awesome Teammate",
        description: "Rated highly by teammates across multiple projects.",
        icon: "★",
        rarity: "RARE",
        theme: "reputation",
        points: 70,
        howToEarn: "Receive high team ratings in at least 2 projects.",
    },
    {
        key: "RELIABLE_BUILDER",
        title: "Reliable Builder",
        description: "Maintained a reliability score above 85% consistently.",
        icon: "⬟",
        rarity: "RARE",
        theme: "reputation",
        points: 90,
        howToEarn: "Keep your reliability score at 85% or above with at least 15 tasks tracked.",
    },
    {
        key: "FAST_REVIEWER",
        title: "Fast Reviewer",
        description: "Known for reviewing contributions quickly.",
        icon: "▶",
        rarity: "UNCOMMON",
        theme: "reputation",
        points: 45,
        howToEarn: "Review and approve task submissions within 24 hours on 5+ occasions.",
    },
    {
        key: "HIGH_TRUST_BUILDER",
        title: "High Trust Builder",
        description: "Top reliability score with significant task volume.",
        icon: "◆",
        rarity: "EPIC",
        theme: "reputation",
        points: 110,
        howToEarn: "Achieve a reliability score of 95%+ with at least 25 tasks.",
    },

    // ── Special ────────────────────────────────────────────────────────────────────
    {
        key: "EARLY_USER",
        title: "Early User",
        description: "Joined Sancodevs during the early access period.",
        icon: "✦",
        rarity: "LEGENDARY",
        theme: "special",
        points: 150,
        howToEarn: "Join the platform during the early access / beta phase.",
    },
    {
        key: "FEATURED_BUILDER",
        title: "Featured Builder",
        description: "Your project was featured by the Sancodevs team.",
        icon: "⬡",
        rarity: "LEGENDARY",
        theme: "special",
        points: 200,
        howToEarn: "Have your project selected as a featured project by the platform team.",
    },
    {
        key: "PLATFORM_PIONEER",
        title: "Platform Pioneer",
        description: "Among the first builders to ship a completed project.",
        icon: "◈",
        rarity: "SPECIAL",
        theme: "special",
        points: 175,
        howToEarn: "Be among the first wave of builders to complete a project on the platform.",
    },
];

// ─── Keyed map for O(1) lookup ────────────────────────────────────────────────

export const ACHIEVEMENT_MAP = Object.fromEntries(
    ACHIEVEMENT_CATALOG.map((a) => [a.key, a])
) as Record<string, AchievementDefinition>;

// ─── Theme config ─────────────────────────────────────────────────────────────

export const THEME_CONFIG: Record<
    AchievementTheme,
    { label: string; color: string; glow: string; bg: string }
> = {
    onboarding: { label: "Onboarding", color: "#94a3b8", glow: "rgba(148,163,184,0.25)", bg: "rgba(148,163,184,0.06)" },
    projects: { label: "Projects", color: "#60a5fa", glow: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.06)" },
    contributions: { label: "Contributions", color: "#4ade80", glow: "rgba(74,222,128,0.25)", bg: "rgba(74,222,128,0.06)" },
    community: { label: "Community", color: "#a78bfa", glow: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)" },
    reputation: { label: "Reputation", color: "#fb923c", glow: "rgba(251,146,60,0.25)", bg: "rgba(251,146,60,0.06)" },
    special: { label: "Special", color: "#fbbf24", glow: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.07)" },
};

// ─── Rarity config ────────────────────────────────────────────────────────────

export const RARITY_CONFIG: Record<
    AchievementRarity,
    { label: string; color: string; border: string }
> = {
    COMMON: { label: "Common", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
    UNCOMMON: { label: "Uncommon", color: "#4ade80", border: "rgba(74,222,128,0.25)" },
    RARE: { label: "Rare", color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
    EPIC: { label: "Epic", color: "#a78bfa", border: "rgba(167,139,250,0.35)" },
    LEGENDARY: { label: "Legendary", color: "#fbbf24", border: "rgba(251,191,36,0.4)" },
    SPECIAL: { label: "Special", color: "#f472b6", border: "rgba(244,114,182,0.4)" },
};

// ─── Share payload builder ────────────────────────────────────────────────────

export function buildSharePayload(
    definition: AchievementDefinition,
    username: string,
    profileUrl: string
): { text: string; url: string; linkedInUrl: string; twitterUrl: string } {
    const text = `Just earned the "${definition.title}" achievement on Sancodevs\n\n${definition.description}\n\n${profileUrl}`;

    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(profileUrl);

    return {
        text,
        url: profileUrl,
        twitterUrl: `https://twitter.com/intent/tweet?text=${encodedText}`,
        linkedInUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
    };
}

// ─── Group achievements by theme for display ─────────────────────────────────

export function groupByTheme(
    entries: Array<{ definition: AchievementDefinition; earned: boolean }>
): Record<AchievementTheme, typeof entries> {
    const grouped: Partial<Record<AchievementTheme, typeof entries>> = {};
    for (const entry of entries) {
        const theme = entry.definition.theme;
        if (!grouped[theme]) grouped[theme] = [];
        grouped[theme]!.push(entry);
    }
    return grouped as Record<AchievementTheme, typeof entries>;
}