<!-- if you're reading the raw markdown, that's egg number one. two more are hiding below. -->

<p align="center">
  <img src="public/sancodevs-logo.png" alt="sancodevs" width="220" />
</p>

<p align="center"><strong>sancodevs.vercel.app</strong></p>

## What this actually is

Finding a team to build something with is harder than it should be. Everyone claims they're reliable, everyone claims they'll finish what they start, and there's no way to check any of it until the project is already dead in a group chat somewhere.

SANCODEVS is a platform for developers to find real project teams, join them, and actually be held accountable for the work, not just the talk. You claim a username, pick your domain and experience level, get matched into projects or start your own, work off a task board, chat with your team in real time, and build a reliability score based on what you actually shipped, not what you said you'd ship.

<!-- egg two: the reliability system in components/profile/reliability is the deepest folder in this repo. someone spent real time on it. -->

## Core features

| Area | What it does |
|---|---|
| Auth and onboarding | Sign up, log in, and get walked through a multi-step onboarding flow: role, domain, experience, availability, commitment, and whether you're looking to find a team or join an existing project |
| Username identity | Every user claims a unique handle that becomes their public identity on the platform |
| Projects | Create a project, browse open ones, apply to join, save projects for later, and track applications |
| Task boards | Every project gets a per-project board where tasks get assigned, requested, approved, reviewed, or marked missed |
| Workspace | A personal hub pulling together everything you're involved in: created, joined, saved, archived, applications, tasks, and recent activity |
| Reliability score | A computed score and tier, built from real project activity, with a trend signal, a timeline of events, and insights explaining why your score is what it is |
| Community groups | Create or join groups, manage membership and capacity, approve pending members, and chat inside each group in real time, including typing indicators, reactions, and seen/delivered receipts |
| Friends and blocking | Send and respond to friend requests, view friend status, and block or unblock users |
| Notifications | Real-time notification bell with cleanup and mark-all-read handling |
| Careers | A public careers page with an application form, separate from the core platform, for anyone hiring through the site |
| Marketing pages | About, blog, contact, privacy, terms, and cookies pages for the public-facing side of the site |

## Tech stack

- Next.js, App Router, TypeScript
- NextAuth for authentication
- Prisma as the ORM, with a migration history documenting the platform's evolution
- Pusher for real-time chat, typing indicators, and notifications
- Email delivery for transactional messages (careers applications, notifications, etc.)

## Project structure

Routes are grouped by intent using Next.js route groups, so the URL structure stays clean while the codebase stays organized.

```
app/
  (auth)/          login and signup pages
  (dashboard)/     the logged-in product: dashboard, projects, community,
                    workspace, profile, settings, notifications, manage
  (marketing)/     public pages: about, blog, careers, contact, legal
  (onboarding)/    the guided onboarding flow after signup
  api/             route handlers mirroring every feature above
                    (auth, community, friends, notifications, onboarding,
                    profile, projects, settings, upload, users, workspace)

components/
  landing/         homepage hero and marketing visuals
  layout/          navbar, sidebar, footer, notification bell
  onboarding/      each step of the onboarding flow as its own component
  profile/         profile card and the full reliability score system
                    (hero, activity graph, timeline, insights, hooks, utils)
  projects/        project cards and filtering
  ui/              the shared design system: shell, sidebar, cards, avatars

lib/
  auth-helpers.ts   session and auth utilities
  email.ts          transactional email sending
  prisma.ts         Prisma client singleton
  pusher.ts / pusher-client.ts   real-time messaging setup, server and client
  scoring.ts        reliability score calculation
  username.ts       username validation and generation
  utils.ts          general helpers

prisma/
  schema.prisma     the full data model
  migrations/        every schema change, in order, from the initial
                      clean-architecture rewrite through reliability events

public/             icon set used across onboarding and profile tags
                     (domains, skill areas, and platform iconography)

types/
  next-auth.d.ts    typed session and user extensions
```

## Getting started

Install dependencies:

```bash
npm install
```

Add a `.env` with your database URL, NextAuth secrets, Pusher keys, and email provider credentials.

Apply the schema:

```bash
npx prisma migrate dev
```

Run it:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Start in `app/page.tsx` if you want to touch the landing page first, or `app/(dashboard)/dashboard/page.tsx` for the logged-in home.

<!-- egg three: 5 migrations to get from init_clean_architecture to reliability_events. that name alone tells you there was a rewrite before this one. -->

## Contributors

- [@sanc0o0](https://github.com/sanc0o0)
- [@mustajab80](https://github.com/mustajab80)

## License

Copyright (c) 2026 sanc0o0. All rights reserved.

This code is proprietary. No part of this repository may be copied, modified, or distributed without written permission from the copyright holder. See [LICENSE](./LICENSE) for the full notice.
