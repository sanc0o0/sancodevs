"use client";

import { useState } from "react";
import type { Timeframe, ActivityBucket } from "../types/reliability.types";
import ReliabilitySection from "../shared/ReliabilitySection";
import ReliabilityTimeframeSwitcher from "./ReliabilityTimeframeSwitcher";
import ReliabilityActivityGraph from "./ReliabilityActivityGraph";

interface ReliabilityActivitySectionProps {
    activity: {
        weekly: ActivityBucket[];
        monthly: ActivityBucket[];
        yearly: ActivityBucket[];
    };
}

export default function ReliabilityActivitySection({
    activity,
}: ReliabilityActivitySectionProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

    const buckets = activity[timeframe].slice(-12);

    return (
        <ReliabilitySection
            label="Task activity"
            action={
                <ReliabilityTimeframeSwitcher value={timeframe} onChange={setTimeframe} />
            }
        >
            <ReliabilityActivityGraph buckets={buckets} />
        </ReliabilitySection>
    );
}