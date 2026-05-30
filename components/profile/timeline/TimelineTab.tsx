"use client";

import { ComingSoonTab } from "@/components/profile/shared/ProfileSkeleton";

export default function TimelineTab() {
    return (
        <ComingSoonTab
            label="Contribution timeline"
            description="Your activity graph, task streaks, reviews completed, and teams formed will be visualised here."
        />
    );
}