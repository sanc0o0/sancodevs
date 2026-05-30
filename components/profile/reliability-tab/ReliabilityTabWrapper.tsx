"use client";

import ReliabilityCard from "@/components/profile/ReliabilityCard";

interface Props {
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function ReliabilityTabWrapper({ subjectId, isOwner }: Props) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ReliabilityCard userId={subjectId} isOwner={isOwner} />
        </div>
    );
}