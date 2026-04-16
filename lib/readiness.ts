// Required skills mapped per goal — weighted by importance
export const GOAL_SKILL_MAP: Record<string, { skill: string; weight: number }[]> = {
    webapp: [
        { skill: "HTML", weight: 1 },
        { skill: "CSS", weight: 1 },
        { skill: "JavaScript", weight: 2 },
        { skill: "React", weight: 2 },
        { skill: "Next.js", weight: 2 },
        { skill: "REST APIs", weight: 1.5 },
        { skill: "PostgreSQL", weight: 1 },
        { skill: "Git", weight: 1.5 },
    ],
    auth: [
        { skill: "JavaScript", weight: 2 },
        { skill: "TypeScript", weight: 1.5 },
        { skill: "Next.js", weight: 2 },
        { skill: "REST APIs", weight: 1.5 },
        { skill: "PostgreSQL", weight: 1.5 },
        { skill: "Node.js", weight: 1 },
    ],
    framework: [
        { skill: "HTML", weight: 1 },
        { skill: "CSS", weight: 1 },
        { skill: "JavaScript", weight: 2.5 },
        { skill: "React", weight: 2.5 },
        { skill: "TypeScript", weight: 1.5 },
    ],
    db: [
        { skill: "JavaScript", weight: 1 },
        { skill: "REST APIs", weight: 1 },
        { skill: "PostgreSQL", weight: 2.5 },
        { skill: "Node.js", weight: 1.5 },
    ],
    realtime: [
        { skill: "JavaScript", weight: 2 },
        { skill: "Node.js", weight: 2 },
        { skill: "REST APIs", weight: 1.5 },
        { skill: "React", weight: 1.5 },
        { skill: "TypeScript", weight: 1 },
    ],
    oss: [
        { skill: "Git", weight: 3 },
        { skill: "JavaScript", weight: 1.5 },
        { skill: "TypeScript", weight: 1 },
        { skill: "React", weight: 1 },
    ],
};

export type UserCategory = "BEGINNER" | "INTERMEDIATE" | "BUILDER";

export interface ReadinessResult {
    score: number;           // 0–100
    category: UserCategory;
    matchedSkills: string[];
    missingSkills: string[];
    totalWeight: number;
    matchedWeight: number;
}

export function calculateReadiness(
    selectedSkills: string[],
    goalId: string
): ReadinessResult {
    const required = GOAL_SKILL_MAP[goalId] ?? [];
    const selected = new Set(selectedSkills.map(s => s.toLowerCase()));

    const totalWeight = required.reduce((sum, r) => sum + r.weight, 0);

    const matched = required.filter(r => selected.has(r.skill.toLowerCase()));
    const missing = required.filter(r => !selected.has(r.skill.toLowerCase()));

    const matchedWeight = matched.reduce((sum, r) => sum + r.weight, 0);
    const score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    let category: UserCategory;
    if (score < 30) category = "BEGINNER";
    else if (score <= 70) category = "INTERMEDIATE";
    else category = "BUILDER";

    return {
        score,
        category,
        matchedSkills: matched.map(r => r.skill),
        missingSkills: missing.map(r => r.skill),
        totalWeight,
        matchedWeight,
    };
}

// Dynamic project suggestions for Builders
export const BUILDER_PROJECT_SUGGESTIONS: Record<string, {
    title: string;
    description: string;
    difficulty: string;
    techHint: string;
    type: string;
}[]> = {
    webapp: [
        { title: "SaaS dashboard with auth", description: "Multi-tenant SaaS with user auth, billing, and analytics dashboard.", difficulty: "Intermediate+", techHint: "Next.js, Prisma, Stripe", type: "Full Stack App" },
        { title: "Real-time collaboration tool", description: "Google Docs-style editor with real-time sync between users.", difficulty: "Advanced", techHint: "Next.js, WebSockets, Yjs", type: "Real-time System" },
        { title: "Developer portfolio generator", description: "Input GitHub username → generate a stunning portfolio site automatically.", difficulty: "Intermediate", techHint: "Next.js, GitHub API", type: "Web App" },
    ],
    auth: [
        { title: "Auth as a service", description: "Build your own Auth0 — JWT, OAuth, MFA, role-based access.", difficulty: "Advanced", techHint: "Node.js, JWT, PostgreSQL", type: "API Service" },
        { title: "SSO system", description: "Single sign-on system across multiple apps using SAML/OpenID.", difficulty: "Expert", techHint: "Node.js, OpenID Connect", type: "API Service" },
    ],
    realtime: [
        { title: "Live coding environment", description: "Browser-based code editor with real-time collaboration like CodeSandbox.", difficulty: "Expert", techHint: "Next.js, WebSockets, Monaco", type: "Real-time System" },
        { title: "Multiplayer game", description: "Real-time multiplayer game with leaderboards and matchmaking.", difficulty: "Advanced", techHint: "Node.js, Socket.io, Redis", type: "Full Stack App" },
    ],
    oss: [
        { title: "CLI tool for developers", description: "A command-line tool that solves a real developer pain point.", difficulty: "Intermediate", techHint: "Node.js, Commander.js", type: "CLI Tool" },
        { title: "VS Code extension", description: "Productivity extension for VS Code that developers will actually install.", difficulty: "Intermediate+", techHint: "TypeScript, VS Code API", type: "Developer Tools" },
    ],
    db: [
        { title: "Database migration tool", description: "CLI tool to manage database schema migrations across environments.", difficulty: "Advanced", techHint: "Node.js, PostgreSQL", type: "CLI Tool" },
        { title: "Data visualization dashboard", description: "Connect to any SQL database and generate visual reports automatically.", difficulty: "Intermediate+", techHint: "Next.js, D3.js, PostgreSQL", type: "Full Stack App" },
    ],
    framework: [
        { title: "Component library", description: "Build and publish your own React component library to npm.", difficulty: "Intermediate+", techHint: "React, TypeScript, Storybook", type: "Developer Tools" },
        { title: "Next.js starter template", description: "Production-ready Next.js template with auth, DB, testing, and CI/CD.", difficulty: "Intermediate", techHint: "Next.js, Prisma, Vitest", type: "Open Source Ready" },
    ],
};