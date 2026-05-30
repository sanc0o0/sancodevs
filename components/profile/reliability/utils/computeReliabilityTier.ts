import type { ReliabilityTierConfig } from "../types/reliability.types";

export const TIER_CONFIG: ReliabilityTierConfig[] = [
    { min: 90, label: "Excellent", color: "#22c55e", behavior: "Delivers consistently and follows through." },
    { min: 75, label: "Good", color: "#86efac", behavior: "Reliable with strong completion habits." },
    { min: 55, label: "Fair", color: "#facc15", behavior: "Mostly consistent with some delays." },
    { min: 35, label: "At risk", color: "#fb923c", behavior: "Needs more consistent participation." },
    { min: 0, label: "Inconsistent", color: "#ef4444", behavior: "Multiple missed or late submissions." },
];

export const NEW_TIER = {
    label: "New" as const,
    color: "var(--muted)" as string,
    behavior: "No execution history yet. Complete tasks to build trust.",
    min: -1,
};

export function computeReliabilityTier(score: number | null): ReliabilityTierConfig & { label: string } {
    if (score === null) return NEW_TIER;
    return TIER_CONFIG.find((t) => score >= t.min) ?? TIER_CONFIG[TIER_CONFIG.length - 1];
}

export function computeConfidence(
    totalTasks: number
): "none" | "low" | "medium" | "high" {
    if (totalTasks === 0) return "none";
    if (totalTasks < 3) return "low";
    if (totalTasks < 10) return "medium";
    return "high";
}