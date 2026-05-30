"use client";

import { useState, useEffect, useRef } from "react";
import type { ReliabilityApiResponse } from "../types/reliability.api.types";

// Module-level cache — survives tab switches, cleared on page nav
const cache = new Map<string, { data: ReliabilityApiResponse; fetchedAt: number }>();
const STALE_MS = 60_000; // 60 seconds

interface UseReliabilityDataResult {
    data: ReliabilityApiResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useReliabilityData(
    userId: string,
    enabled: boolean   // only fetch when the section is first expanded
): UseReliabilityDataResult {
    const [data, setData] = useState<ReliabilityApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchedRef = useRef(false);

    async function doFetch() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/users/${userId}/reliability`);
            if (!res.ok) throw new Error(`${res.status}`);
            const json: ReliabilityApiResponse = await res.json();
            cache.set(userId, { data: json, fetchedAt: Date.now() });
            setData(json);
        } catch (e) {
            setError("Failed to load reliability data.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!enabled) return;
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        // Serve from cache if fresh
        const cached = cache.get(userId);
        if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
            setData(cached.data);
            return;
        }

        doFetch();
    }, [enabled, userId]);

    return { data, loading, error, refetch: doFetch };
}