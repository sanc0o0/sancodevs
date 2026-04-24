# File Tree: app

**Root Path:** `c:\Users\abulk\sancodevs`

**app**
```
├── 📁 (auth)
│   ├── 📁 login
│   │   └── 📄 page.tsx
│   └── 📁 signup
│       └── 📄 page.tsx
├── 📁 (dashboard)
│   ├── 📁 applications
│   ├── 📁 community
│   │   ├── 📁 [id]
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 ChatPane.tsx
│   │   ├── 📄 CommunityShell.tsx
│   │   ├── 📄 CreateGroupButton.tsx
│   │   ├── 📄 DetailsPane.tsx
│   │   ├── 📄 GroupList.tsx
│   │   ├── 📄 JoinGroupButton.tsx
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 dashboard
│   │   └── 📄 page.tsx
│   ├── 📁 learn
│   │   ├── 📁 [moduleId]
│   │   │   ├── 📄 ModuleActions.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 complete
│   │   │   ├── 📄 CompletionActions.tsx
│   │   │   └── 📄 page.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 notifications
│   │   ├── 📄 NotificationsClient.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 profile
│   │   └── 📄 page.tsx
│   ├── 📁 projects
│   │   ├── 📁 [id]
│   │   │   ├── 📁 board
│   │   │   │   ├── 📄 TaskBoard.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 ApplicantActions.tsx
│   │   │   ├── 📄 JoinRequestButton.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 new
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 ProjectStatusControl.tsx
│   │   ├── 📄 ProjectsClient.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 settings
│   │   ├── 📄 BlockedUsersTab.tsx
│   │   ├── 📄 FriendsTab.tsx
│   │   ├── 📄 SettingsClient.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 user
│   │   └── 📁 [userId]
│   │       ├── 📄 AddFriendButton.tsx
│   │       ├── 📄 BlockButton.tsx
│   │       ├── 📄 ProfileTabs.tsx
│   │       └── 📄 page.tsx
│   └── 📄 layout.tsx
├── 📁 (marketing)
│   ├── 📁 about
│   │   └── 📄 page.tsx
│   ├── 📁 blog
│   │   ├── 📁 [slug]
│   │   │   └── 📄 page.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 careers
│   │   ├── 📁 apply
│   │   │   ├── 📄 CareerApplyForm.tsx
│   │   │   └── 📄 page.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 contact
│   │   └── 📄 page.tsx
│   ├── 📁 cookies
│   │   └── 📄 page.tsx
│   ├── 📁 privacy
│   │   └── 📄 page.tsx
│   ├── 📁 terms
│   │   └── 📄 page.tsx
│   └── 📄 layout.tsx
├── 📁 (onboarding)
│   └── 📁 onboarding
│       ├── 📄 OnboardingClient.tsx
│       ├── 📄 layout.tsx
│       └── 📄 page.tsx
├── 📁 api
│   ├── 📁 applications
│   ├── 📁 auth
│   │   ├── 📁 [...nextauth]
│   │   │   └── 📄 route.ts
│   │   └── 📁 register
│   │       └── 📄 route.ts
│   ├── 📁 careers
│   │   └── 📁 apply
│   │       └── 📄 route.ts
│   ├── 📁 community
│   │   ├── 📁 groups
│   │   │   ├── 📁 [id]
│   │   │   │   ├── 📁 add-member
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 members
│   │   │   │   │   ├── 📁 approve
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 remove
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 pending
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 settings
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 invite
│   │   │   │   └── 📁 respond
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 join
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 leave
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 messages
│   │   │   ├── 📁 [id]
│   │   │   │   ├── 📁 react
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 seen
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 typing
│   │   │   └── 📄 route.ts
│   │   └── 📁 upload
│   │       └── 📄 route.ts
│   ├── 📁 contact
│   │   └── 📄 route.ts
│   ├── 📁 friends
│   │   ├── 📁 block
│   │   │   └── 📄 route.ts
│   │   ├── 📁 blocked
│   │   │   └── 📄 route.ts
│   │   ├── 📁 blocked-ids
│   │   │   └── 📄 route.ts
│   │   ├── 📁 list
│   │   │   └── 📄 route.ts
│   │   ├── 📁 request
│   │   │   └── 📄 route.ts
│   │   ├── 📁 respond
│   │   │   └── 📄 route.ts
│   │   └── 📁 status
│   │       └── 📄 route.ts
│   ├── 📁 notifications
│   │   ├── 📁 cleanup
│   │   │   └── 📄 route.ts
│   │   ├── 📁 real-all
│   │   │   └── 📄 route.ts
│   │   └── 📄 route.ts
│   ├── 📁 onboarding
│   │   ├── 📁 check
│   │   │   └── 📄 route.ts
│   │   ├── 📁 me
│   │   │   └── 📄 route.ts
│   │   └── 📄 route.ts
│   ├── 📁 progress
│   │   └── 📄 route.ts
│   ├── 📁 projects
│   │   ├── 📁 [id]
│   │   │   ├── 📁 tasks
│   │   │   │   ├── 📁 [taskId]
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 applications
│   │   │   └── 📄 route.ts
│   │   ├── 📁 apply
│   │   │   └── 📄 route.ts
│   │   ├── 📁 seen
│   │   │   └── 📄 route.ts
│   │   └── 📄 route.ts
│   ├── 📁 settings
│   │   ├── 📁 delete-account
│   │   │   └── 📄 route.ts
│   │   └── 📁 notifications
│   │       └── 📄 route.ts
│   ├── 📁 tasks
│   ├── 📁 upload
│   │   └── 📁 resume
│   │       └── 📄 route.ts
│   └── 📁 users
│       └── 📁 [userId]
│           └── 📁 stats
│               └── 📄 route.ts
├── 🎨 globals.css
├── 🖼️ icon.svg
├── 📄 layout.tsx
├── 📄 page.tsx
└── 📄 providers.tsx
```

**components**
```
├── 📁 landing
│   └── 📄 HeroBackground.tsx
├── 📁 layout
│   ├── 📄 Footer.tsx
│   ├── 📄 Navbar.tsx
│   ├── 📄 NotificationBell.tsx
│   └── 📄 Sidebar.tsx
├── 📁 marketing
│   └── 📄 PageHero.tsx
├── 📁 onboarding
│   ├── 📄 GoalPicker.tsx
│   ├── 📄 PathResult.tsx
│   ├── 📄 SkillPicker.tsx
│   └── 📄 StepIndicator.tsx
├── 📁 ui
│   └── 📄 BackButton.tsx
└── 📄 loginButtons.tsx
```
**lib**
```
├── 📄 auth.ts
├── 📄 content.ts
├── 📄 email.ts
├── 📄 path.ts
├── 📄 prisma.ts
├── 📄 pusher-client.ts
├── 📄 pusher.ts
├── 📄 readiness.ts
├── 📄 theme.tsx
└── 📄 utils.ts
```
node_modules
prisma
public
types
.env
.gitignore
AGENTS.md
CLAUDE.md
eslingt.config.mjs
next-env.d.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
proxy.ts
README.md
tsconfig.json

---
*Generated by FileTree Pro Extension*