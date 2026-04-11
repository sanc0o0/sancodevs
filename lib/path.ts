export type PathStep = {
    title: string;
    sub: string;
    duration: string;
};

export type Path = {
    id: string;
    label: string;
    modules: PathStep[];
};

export const SKILLS = [
    "HTML", "CSS", "JavaScript", "TypeScript",
    "React", "Next.js", "Node.js", "Git",
    "REST APIs", "PostgreSQL", "Docker", "GraphQL",
    "Tailwind CSS", "Testing", "Python", "Linux",
];

export const GOALS = [
    { id: "webapp", icon: "▣", title: "Build a web app", desc: "Full-stack project from scratch" },
    { id: "auth", icon: "◈", title: "Auth systems", desc: "JWT, OAuth, sessions, cookies" },
    { id: "framework", icon: "⊞", title: "Master a framework", desc: "Go deep on React or Next.js" },
    { id: "db", icon: "⊟", title: "Understand databases", desc: "SQL, Postgres, Prisma, ORMs" },
    { id: "realtime", icon: "◎", title: "Real-time features", desc: "WebSockets, SSE, live data" },
    { id: "oss", icon: "⊕", title: "Open source skills", desc: "Git workflows, PRs, contributing" },
];

export const PATHS: Record<string, Path> = {
    webapp: {
        id: "webapp",
        label: "Full-stack web app",
        modules: [
            { title: "Project setup", sub: "Next.js, folder structure, env vars", duration: "1 hr" },
            { title: "Routing & pages", sub: "App router, layouts, loading states", duration: "2 hrs" },
            { title: "Backend API routes", sub: "REST endpoints, validation", duration: "3 hrs" },
            { title: "Database layer", sub: "Prisma, Postgres, migrations", duration: "2 hrs" },
            { title: "Auth integration", sub: "NextAuth, protected routes", duration: "2 hrs" },
            { title: "Deploy", sub: "Vercel, production env setup", duration: "1 hr" },
        ],
    },
    auth: {
        id: "auth",
        label: "Auth system in Next.js",
        modules: [
            { title: "How auth works", sub: "Sessions vs JWT, cookies, tokens", duration: "1 hr" },
            { title: "NextAuth setup", sub: "Providers, adapter, secret", duration: "2 hrs" },
            { title: "OAuth flow", sub: "GitHub & Google providers", duration: "2 hrs" },
            { title: "Credentials auth", sub: "Email/password, bcrypt hashing", duration: "2 hrs" },
            { title: "Protected routes", sub: "Middleware, session guards", duration: "1 hr" },
            { title: "Deploy securely", sub: "Env vars, HTTPS, secrets", duration: "1 hr" },
        ],
    },
    framework: {
        id: "framework",
        label: "React & Next.js mastery",
        modules: [
            { title: "React fundamentals", sub: "Components, props, state, hooks", duration: "3 hrs" },
            { title: "Advanced hooks", sub: "useEffect, useContext, custom hooks", duration: "2 hrs" },
            { title: "Next.js app router", sub: "Layouts, server vs client components", duration: "2 hrs" },
            { title: "Data fetching", sub: "Server actions, fetch, caching", duration: "2 hrs" },
            { title: "Performance", sub: "Code splitting, lazy loading, images", duration: "1 hr" },
            { title: "Build & deploy", sub: "Next.js build, Vercel deployment", duration: "1 hr" },
        ],
    },
    db: {
        id: "db",
        label: "Database fundamentals",
        modules: [
            { title: "SQL basics", sub: "SELECT, JOIN, WHERE, indexes", duration: "2 hrs" },
            { title: "Postgres setup", sub: "Local DB, psql, pgAdmin", duration: "1 hr" },
            { title: "Prisma intro", sub: "Schema, models, relations", duration: "2 hrs" },
            { title: "Migrations", sub: "prisma migrate, schema changes", duration: "1 hr" },
            { title: "Queries & relations", sub: "findMany, include, nested writes", duration: "2 hrs" },
            { title: "Production DB", sub: "Supabase, connection pooling", duration: "1 hr" },
        ],
    },
    realtime: {
        id: "realtime",
        label: "Real-time features",
        modules: [
            { title: "HTTP vs WebSockets", sub: "How real-time connections differ", duration: "1 hr" },
            { title: "Server-Sent Events", sub: "SSE with Next.js, streaming", duration: "2 hrs" },
            { title: "WebSocket basics", sub: "ws library, events, rooms", duration: "2 hrs" },
            { title: "Socket.io", sub: "Rooms, broadcasts, namespaces", duration: "2 hrs" },
            { title: "Live UI updates", sub: "Optimistic updates, React state", duration: "2 hrs" },
            { title: "Scale & deploy", sub: "Sticky sessions, Redis adapter", duration: "1 hr" },
        ],
    },
    oss: {
        id: "oss",
        label: "Open source contributor",
        modules: [
            { title: "Git fundamentals", sub: "init, add, commit, log, diff", duration: "1 hr" },
            { title: "Branching & merging", sub: "Branch, merge, rebase, conflicts", duration: "2 hrs" },
            { title: "GitHub workflow", sub: "Fork, clone, remote, push", duration: "1 hr" },
            { title: "Pull requests", sub: "PR etiquette, reviews, feedback", duration: "2 hrs" },
            { title: "Find issues", sub: "Good first issues, labels, triage", duration: "1 hr" },
            { title: "Your first PR", sub: "Real open source contribution", duration: "2 hrs" },
        ],
    },
};


