"use client";

import dynamic from "next/dynamic";
import { TabSkeleton } from "@/components/profile/shared/ProfileSkeleton";

const OverviewTab = dynamic(() => import("@/components/profile/overview/OverviewTab"), { loading: () => <TabSkeleton />, ssr: false });
const ReliabilityTabWrapper = dynamic(() => import("@/components/profile/reliability-tab/ReliabilityTabWrapper"), { loading: () => <TabSkeleton />, ssr: false });
const ProjectsTab = dynamic(() => import("@/components/profile/projects/ProjectsTab"), { loading: () => <TabSkeleton />, ssr: false });
const TasksTab = dynamic(() => import("@/components/profile/tasks/TasksTab"), { loading: () => <TabSkeleton />, ssr: false });
const AchievementTab = dynamic(() => import("@/components/profile/achievements/AchievementTab"), { loading: () => <TabSkeleton />, ssr: false });
const ReputationTab = dynamic(() => import("@/components/profile/reputation/ReputationTab"), { loading: () => <TabSkeleton />, ssr: false });
const TimelineTab = dynamic(() => import("@/components/profile/timeline/TimelineTab"), { loading: () => <TabSkeleton />, ssr: false });
const LinksTab = dynamic(() => import("@/components/profile/links/LinksTab"), { loading: () => <TabSkeleton />, ssr: false });

interface ProfileTabContentProps {
    activeTab: string;
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function ProfileTabContent({ activeTab, subjectId, isOwner, username }: ProfileTabContentProps) {
    const common = { subjectId, isOwner, username };

    return (
        <div style={{ animation: "tabFadeIn 0.18s ease" }}>
            <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
            {activeTab === "overview" && <OverviewTab {...common} />}
            {activeTab === "reliability" && <ReliabilityTabWrapper {...common} />}
            {activeTab === "projects" && <ProjectsTab {...common} />}
            {activeTab === "tasks" && isOwner && <TasksTab {...common} />}
            {activeTab === "achievements" && <AchievementTab {...common} />}
            {activeTab === "reputation" && <ReputationTab {...common} />}
            {activeTab === "timeline" && <TimelineTab {...common} />}
            {activeTab === "links" && <LinksTab {...common} />}
        </div>
    );
}