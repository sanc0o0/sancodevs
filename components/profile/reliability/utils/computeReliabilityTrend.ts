import type { ActivityBucket, ReliabilityTrendSignals } from "../types/reliability.types";

function bucketScore(buckets: ActivityBucket[]): number {
    const total = buckets.reduce((s, b) => s + b.done + b.late + b.missed, 0);
    if (total === 0) return 0;
    const weighted = buckets.reduce((s, b) => s + b.done * 1.0 + b.late * 0.6, 0);
    return (weighted / total) * 100;
}

export function computeReliabilityTrend(
    buckets: ActivityBucket[]
): ReliabilityTrendSignals {
    const empty: ReliabilityTrendSignals = {
        improving: false,
        declining: false,
        stable: false,
        label: null,
    };

    if (buckets.length < 2) return empty;

    const recent = buckets.slice(-4);
    const older = buckets.slice(-8, -4);

    const recentScore = bucketScore(recent);
    const olderScore = bucketScore(older);

    // Consistency streak — consecutive periods with any activity
    let streak = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
        const b = buckets[i];
        if (b.done + b.late + b.missed > 0) streak++;
        else break;
    }

    const noMissedRecently = recent.every((b) => b.missed === 0);
    const hasOlder = older.length > 0;
    const diff = recentScore - olderScore;

    if (hasOlder && diff > 8) {
        return { improving: true, declining: false, stable: false, label: "↑ Improving over recent periods" };
    }
    if (streak >= 8) {
        return { improving: false, declining: false, stable: true, label: `Consistent for ${streak} periods` };
    }
    if (streak >= 3 && noMissedRecently) {
        return { improving: false, declining: false, stable: true, label: "No missed deadlines recently" };
    }
    if (hasOlder && diff < -8) {
        return { improving: false, declining: true, stable: false, label: "↓ Declining recently" };
    }
    if (streak === 0) {
        return { improving: false, declining: false, stable: false, label: "No recent activity" };
    }

    return empty;
}