"use client";

import { useMemo } from "react";
import type { ActivityBucket, ReliabilityTrendSignals } from "../types/reliability.types";
import { computeReliabilityTrend } from "../utils/computeReliabilityTrend";

export function useReliabilityTrend(
    buckets: ActivityBucket[]
): ReliabilityTrendSignals {
    return useMemo(() => computeReliabilityTrend(buckets), [buckets]);
}