interface RawCounts {
    done: number;
    late: number;
    missed: number;
    rejected: number;
}

/**
 * Computes reliability score from raw task counts.
 * Returns null when total < 3 (insufficient data).
 * Formula: (done×1.0 + late×0.6 + rejected×0.2) / total × 100
 */
export function computeReliabilityScore(counts: RawCounts): number | null {
    const total = counts.done + counts.late + counts.missed + counts.rejected;
    if (total < 3) return null;

    const weighted =
        counts.done * 1.0 +
        counts.late * 0.6 +
        counts.rejected * 0.2;
    // missed contributes 0

    return Math.round((weighted / total) * 100);
}

export function computeOnTimeRate(done: number, total: number): number {
    if (total === 0) return 100;
    return Math.round((done / total) * 100);
}

/**
 * Computes score delta for a single event.
 * Used when writing ReliabilityEvent records.
 */
export function computeEventDelta(
    eventType: "COMPLETED" | "LATE" | "MISSED" | "REJECTED",
    totalBefore: number
): number {
    if (totalBefore < 2) return 0; // first few tasks — high variance, don't show delta
    const weight: Record<string, number> = {
        COMPLETED: 1.0,
        LATE: 0.6,
        MISSED: 0.0,
        REJECTED: 0.2,
    };
    // Approximate marginal impact
    const w = weight[eventType] ?? 0;
    return Math.round(((w - 0.8) / (totalBefore + 1)) * 100 * 10) / 10;
}