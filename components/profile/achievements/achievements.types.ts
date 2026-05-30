export type AchievementRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "SPECIAL";

export type AchievementTheme =
    | "onboarding"
    | "projects"
    | "contributions"
    | "community"
    | "reputation"
    | "special";

export interface AchievementDefinition {
    key: string;
    title: string;
    description: string;
    icon: string;           // emoji or svg id
    rarity: AchievementRarity;
    theme: AchievementTheme;
    points: number;
    howToEarn: string;      // shown in the info tooltip
}

export interface UserAchievement {
    id: string;
    achievementKey: string;
    earnedAt: string;       // ISO date string
    sharedCount: number;
}

// Merged view: definition + earned status
export interface AchievementEntry {
    definition: AchievementDefinition;
    earned: UserAchievement | null;   // null = locked
}

export interface AchievementsApiResponse {
    earned: UserAchievement[];
    total: number;
    earnedCount: number;
}