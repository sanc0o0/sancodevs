"use client";

import { useState } from "react";
import StepIndicator from "@/components/onboarding/StepIndicator";
import SkillPicker from "@/components/onboarding/SkillPicker";
import GoalPicker from "@/components/onboarding/GoalPicker";
import PathResult from "@/components/onboarding/PathResult";
import { calculateReadiness, type ReadinessResult } from "@/lib/readiness";

const STEP_LABELS = ["Skills", "Goal", "Your path"];

export default function OnboardingClient() {
    const [step, setStep] = useState(0);
    const [skills, setSkills] = useState<string[]>([]);
    const [goalId, setGoalId] = useState<string>("");
    const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

    function handleGoalSelected(goal: string) {
        setGoalId(goal);
        const result = calculateReadiness(skills, goal);
        setReadiness(result);
        setStep(2);
    }

    return (
        <div>
            <StepIndicator step={step} steps={STEP_LABELS} />
            <div className="max-w-xl mx-auto px-6 py-10">
                {step === 0 && (
                    <SkillPicker onNext={s => { setSkills(s); setStep(1); }} />
                )}
                {step === 1 && (
                    <GoalPicker
                        onNext={handleGoalSelected}
                        onBack={() => setStep(0)}
                    />
                )}
                {step === 2 && readiness && (
                    <PathResult
                        goalId={goalId}
                        skills={skills}
                        readiness={readiness}
                        onBack={() => setStep(1)}
                    />
                )}
            </div>
        </div>
    );
}