"use client";

import { useState } from "react";
import StepIndicator from "@/components/onboarding/StepIndicator";
import SkillPicker from "@/components/onboarding/SkillPicker";
import GoalPicker from "@/components/onboarding/GoalPicker";
import PathResult from "@/components/onboarding/PathResult";

const STEP_LABELS = ["Skills", "Goal", "Your path"];

export default function OnboardingClient() {
    const [step, setStep] = useState(0);
    const [skills, setSkills] = useState<string[]>([]);
    const [goalId, setGoalId] = useState<string>("");

    return (
        <div>
            <StepIndicator step={step} steps={STEP_LABELS} />
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 2rem" }}>
                {step === 0 && (
                    <SkillPicker onNext={s => { setSkills(s); setStep(1); }} />
                )}
                {step === 1 && (
                    <GoalPicker onNext={g => { setGoalId(g); setStep(2); }} onBack={() => setStep(0)} />
                )}
                {step === 2 && (
                    <PathResult goalId={goalId} skills={skills} onBack={() => setStep(1)} />
                )}
            </div>
        </div>
    );
}