# File Tree: sancodevs

**Generated:** 5/26/2026, 10:05:04 PM
**Root Path:** `c:\Users\abulk\sancodevs`

```
├── 📁 app
│   ├── 📁 (auth)
│   │   ├── 📁 login
│   │   │   └── 📄 page.tsx
│   │   └── 📁 signup
│   │       └── 📄 page.tsx
│   ├── 📁 (dashboard)
│   │   ├── 📁 applications
│   │   ├── 📁 community
│   │   │   ├── 📁 [id]
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 ChatPane.tsx
│   │   │   ├── 📄 CommunityShell.tsx
│   │   │   ├── 📄 CreateGroupButton.tsx
│   │   │   ├── 📄 DetailsPane.tsx
│   │   │   ├── 📄 GroupList.tsx
│   │   │   ├── 📄 JoinGroupButton.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 dashboard
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 manage
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 notifications
│   │   │   ├── 📄 NotificationsClient.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 profile
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 projects
│   │   │   ├── 📁 [id]
│   │   │   │   ├── 📁 board
│   │   │   │   │   ├── 📄 TaskBoard.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📄 AccordionSections.tsx
│   │   │   │   ├── 📄 ApplicantActions.tsx
│   │   │   │   ├── 📄 CopyButton.tsx
│   │   │   │   ├── 📄 JoinRequestButton.tsx
│   │   │   │   ├── 📄 MobileActions.tsx
│   │   │   │   ├── 📄 SaveProjectButton.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 new
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 ProjectStatusControl.tsx
│   │   │   ├── 📄 ProjectsClient.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 settings
│   │   │   ├── 📄 BlockedUsersTab.tsx
│   │   │   ├── 📄 FriendsTab.tsx
│   │   │   ├── 📄 SettingsClient.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 user
│   │   │   └── 📁 [userId]
│   │   │       ├── 📄 AddFriendButton.tsx
│   │   │       ├── 📄 BlockButton.tsx
│   │   │       ├── 📄 ProfileTabs.tsx
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 workspace
│   │   │   ├── 📄 Activity.tsx
│   │   │   ├── 📄 Applications.tsx
│   │   │   ├── 📄 Archived.tsx
│   │   │   ├── 📄 Created.tsx
│   │   │   ├── 📄 Joined.tsx
│   │   │   ├── 📄 Saved.tsx
│   │   │   ├── 📄 Tasks.tsx
│   │   │   ├── 📄 WorkspaceShell.tsx
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📄 types.ts
│   │   └── 📄 layout.tsx
│   ├── 📁 (marketing)
│   │   ├── 📁 about
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 blog
│   │   │   ├── 📁 [slug]
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 careers
│   │   │   ├── 📁 apply
│   │   │   │   ├── 📄 CareerApplyForm.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 contact
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 cookies
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 privacy
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 terms
│   │   │   └── 📄 page.tsx
│   │   └── 📄 layout.tsx
│   ├── 📁 (onboarding)
│   │   └── 📁 onboarding
│   │       ├── 📄 OnboardingClient.tsx
│   │       ├── 📄 layout.tsx
│   │       └── 📄 page.tsx
│   ├── 📁 api
│   │   ├── 📁 applications
│   │   ├── 📁 auth
│   │   │   ├── 📁 [...nextauth]
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 register
│   │   │       └── 📄 route.ts
│   │   ├── 📁 careers
│   │   │   └── 📁 apply
│   │   │       └── 📄 route.ts
│   │   ├── 📁 community
│   │   │   ├── 📁 groups
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 add-member
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 capacity
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 delete
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 members
│   │   │   │   │   │   ├── 📁 approve
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 remove
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 pending
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 settings
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 invite
│   │   │   │   │   └── 📁 respond
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 join
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 leave
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 messages
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 react
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 seen
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 typing
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 upload
│   │   │       └── 📄 route.ts
│   │   ├── 📁 contact
│   │   │   └── 📄 route.ts
│   │   ├── 📁 friends
│   │   │   ├── 📁 block
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 blocked
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 blocked-ids
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 list
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 request
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 respond
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 status
│   │   │       └── 📄 route.ts
│   │   ├── 📁 notifications
│   │   │   ├── 📁 cleanup
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 real-all
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 onboarding
│   │   │   ├── 📁 check
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 me
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 profile
│   │   │   └── 📄 route.ts
│   │   ├── 📁 projects
│   │   │   ├── 📁 [id]
│   │   │   │   ├── 📁 tasks
│   │   │   │   │   ├── 📁 [taskId]
│   │   │   │   │   │   ├── 📁 approve-assignment
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 assignment-requests
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 request-assignment
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 mark-missed
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 updates
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 applications
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 apply
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 save
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 seen
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 settings
│   │   │   ├── 📁 delete-account
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 notifications
│   │   │       └── 📄 route.ts
│   │   ├── 📁 tasks
│   │   ├── 📁 upload
│   │   │   ├── 📁 profile-image
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 project-image
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 resume
│   │   │       └── 📄 route.ts
│   │   ├── 📁 users
│   │   │   └── 📁 [userId]
│   │   │       ├── 📁 reliability
│   │   │       │   └── 📄 route.ts
│   │   │       └── 📁 stats
│   │   │           └── 📄 route.ts
│   │   └── 📁 workspace
│   │       ├── 📁 activity
│   │       │   └── 📄 route.ts
│   │       ├── 📁 applications
│   │       │   └── 📄 route.ts
│   │       ├── 📁 archived
│   │       │   └── 📄 route.ts
│   │       ├── 📁 joined
│   │       │   └── 📄 route.ts
│   │       ├── 📁 saved
│   │       │   └── 📄 route.ts
│   │       └── 📁 tasks
│   │           └── 📄 route.ts
│   ├── 🎨 globals.css
│   ├── 🖼️ icon.svg
│   ├── 📄 layout.tsx
│   ├── 📄 page.tsx
│   └── 📄 providers.tsx
├── 📁 components
│   ├── 📁 landing
│   │   └── 📄 HeroBackground.tsx
│   ├── 📁 layout
│   │   ├── 📄 Footer.tsx
│   │   ├── 📄 Navbar.tsx
│   │   ├── 📄 NotificationBell.tsx
│   │   └── 📄 Sidebar.tsx
│   ├── 📁 marketing
│   │   └── 📄 PageHero.tsx
│   ├── 📁 onboarding
│   │   ├── 📄 AvailabilitySelection.tsx
│   │   ├── 📄 CommitmentSelection.tsx
│   │   ├── 📄 DomainSelection.tsx
│   │   ├── 📄 ExperienceSelection.tsx
│   │   ├── 📄 FindTeamFlow.tsx
│   │   ├── 📄 JoinProjectFlow.tsx
│   │   ├── 📄 OnboardingLayout.tsx
│   │   ├── 📄 OnboardingProgress.tsx
│   │   ├── 📄 RoleSelection.tsx
│   │   ├── 📄 StepIndicator.tsx
│   │   ├── 📄 TeamPreferenceSelection.tsx
│   │   ├── 📄 UsernameSelection.tsx
│   │   └── 📄 WorkPreferenceSelection.tsx
│   ├── 📁 profile
│   │   ├── 📁 reliability
│   │   │   ├── 📁 activity
│   │   │   │   ├── 📄 ReliabilityActivityEmptyState.tsx
│   │   │   │   ├── 📄 ReliabilityActivityGraph.tsx
│   │   │   │   ├── 📄 ReliabilityActivityLegend.tsx
│   │   │   │   ├── 📄 ReliabilityActivitySection.tsx
│   │   │   │   ├── 📄 ReliabilityTimeframeSwitcher.tsx
│   │   │   │   └── 📄 ReliabilityTooltip.tsx
│   │   │   ├── 📁 hero
│   │   │   │   ├── 📄 ReliabilityHero.tsx
│   │   │   │   ├── 📄 ReliabilityScoreRing.tsx
│   │   │   │   ├── 📄 ReliabilityTierBadge.tsx
│   │   │   │   └── 📄 ReliabilityTrendSignal.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 useReliabilityData.ts
│   │   │   │   └── 📄 useReliabilityTrend.ts
│   │   │   ├── 📁 info
│   │   │   │   └── 📄 ReliabilityInfoDrawer.tsx
│   │   │   ├── 📁 insights
│   │   │   │   ├── 📄 ReliabilityInsightRow.tsx
│   │   │   │   └── 📄 ReliabilityInsights.tsx
│   │   │   ├── 📁 shared
│   │   │   │   ├── 📄 ReliabilityEmpty.tsx
│   │   │   │   ├── 📄 ReliabilitySection.tsx
│   │   │   │   └── 📄 ReliabilitySkeleton.tsx
│   │   │   ├── 📁 states
│   │   │   │   ├── 📄 ReliabilityErrorState.tsx
│   │   │   │   └── 📄 ReliabilityNewUserState.tsx
│   │   │   ├── 📁 timeline
│   │   │   │   ├── 📄 ReliabilityTimeline.tsx
│   │   │   │   └── 📄 ReliabilityTimelineEvent.tsx
│   │   │   ├── 📁 types
│   │   │   │   ├── 📄 reliability.api.types.ts
│   │   │   │   └── 📄 reliability.types.ts
│   │   │   ├── 📁 utils
│   │   │   │   ├── 📄 computeReliabilityScore.ts
│   │   │   │   ├── 📄 computeReliabilityTier.ts
│   │   │   │   ├── 📄 computeReliabilityTrend.ts
│   │   │   │   └── 📄 normalizeReliabilityEvents.ts
│   │   │   └── 📄 ReliabilityTab.tsx
│   │   ├── 📄 ProfileCard.tsx
│   │   └── 📄 ReliabilityCard.tsx
│   ├── 📁 projects
│   │   ├── 📄 ProjectCard.tsx
│   │   └── 📄 ProjectFilters.tsx
│   ├── 📁 ui
│   │   ├── 📄 AppCard.tsx
│   │   ├── 📄 AppHeader.tsx
│   │   ├── 📄 AppShell.tsx
│   │   ├── 📄 AppSidebar.tsx
│   │   ├── 📄 BackButton.tsx
│   │   ├── 📄 EmptyState.tsx
│   │   ├── 📄 PageContainer.tsx
│   │   ├── 📄 SectionHeader.tsx
│   │   ├── 📄 StatCard.tsx
│   │   └── 📄 UserAvatar.tsx
│   └── 📄 loginButtons.tsx
├── 📁 lib
│   ├── 📄 auth-helpers.ts
│   ├── 📄 email.ts
│   ├── 📄 prisma.ts
│   ├── 📄 pusher-client.ts
│   ├── 📄 pusher.ts
│   ├── 📄 scoring.ts
│   ├── 📄 theme.tsx
│   ├── 📄 username.ts
│   └── 📄 utils.ts
├── 📁 prisma
│   ├── 📁 migrations
│   │   ├── 📁 20260515185715_init_clean_architecture
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260515202848_add_submitted_at
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260517104725_add_task_review_fields
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260518034305_add_saved_projects_and_update_visibility
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260525044758_add_reliability_events
│   │   │   └── 📄 migration.sql
│   │   └── ⚙️ migration_lock.toml
│   └── 📄 schema.prisma
├── 📁 public
│   ├── 🖼️ icons8-add-male-user-group-64.png
│   ├── 🖼️ icons8-app-development-100.png
│   ├── 🖼️ icons8-backend-development-48.png
│   ├── 🖼️ icons8-beginner-100.png
│   ├── 🖼️ icons8-clock-32.png
│   ├── 🖼️ icons8-color-palette-100.png
│   ├── 🖼️ icons8-cyber-security-50.png
│   ├── 🖼️ icons8-developer-100.png
│   ├── 🖼️ icons8-development-skill-32.png
│   ├── 🖼️ icons8-devops-50.png
│   ├── 🖼️ icons8-edit-pencil-50.png
│   ├── 🖼️ icons8-find-100.png
│   ├── 🖼️ icons8-game-controller-64.png
│   ├── 🖼️ icons8-globe-48.png
│   ├── 🖼️ icons8-holiday-100.png
│   ├── 🖼️ icons8-robot-100.png
│   ├── 🖼️ icons8-start-50.png
│   ├── 🖼️ icons8-startup-100.png
│   ├── 🖼️ icons8-time-limit-50.png
│   ├── 🖼️ icons8-timer-32.png
│   ├── 🖼️ icons8-view-24.png
│   └── 🖼️ icons8-web-development-64.png
├── 📁 types
│   └── 📄 next-auth.d.ts
├── ⚙️ .gitignore
├── 📝 AGENTS.md
├── 📝 CLAUDE.md
├── 📝 README.md
├── 📝 Untitled-2.md
├── 📄 eslint.config.mjs
├── 📄 next.config.ts
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 postcss.config.mjs
├── 📄 proxy.ts
└── ⚙️ tsconfig.json
```

---
*Generated by FileTree Pro Extension*