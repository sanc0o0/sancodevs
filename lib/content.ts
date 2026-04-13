export type ContentSection = {
    type: "concept" | "why" | "analogy" | "keypoints" | "exercise" | "visual";
    title: string;
    body?: string;
    points?: string[];
    code?: string;
    language?: string;
    exercise?: {
        prompt: string;
        steps: string[];
        checkpoint: string;
    };
};

export type ModuleContent = {
    pathId: string;
    moduleIndex: number;
    title: string;
    emoji: string;
    duration: string;
    sections: ContentSection[];
};

export const CONTENT: Record<string, ModuleContent[]> = {

    // ─── AUTH PATH ──────────────────────────────────────────────────────────
    auth: [
        {
            pathId: "auth",
            moduleIndex: 0,
            title: "How auth works",
            emoji: "🔐",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "What is authentication?",
                    body: "Authentication answers one question: who are you? Every time you log into an app, the server needs to verify your identity before letting you in. That's authentication. It's different from authorization — which asks: what are you allowed to do?",
                },
                {
                    type: "why",
                    title: "Why this matters",
                    body: "Without auth, anyone could access anyone's data. Auth is the lock on the front door of every web application you'll ever build. Get it wrong and users' data is compromised. Get it right and your app is safe and trustworthy.",
                },
                {
                    type: "analogy",
                    title: "Think of it like a hotel",
                    body: "When you check into a hotel, you show your passport (your credentials). The receptionist verifies it and gives you a key card (your session/token). You use that key card to access your room (protected routes). The key card expires — just like sessions do. You don't show your passport every time you enter your room.",
                },
                {
                    type: "visual",
                    title: "The auth flow",
                    body: "LOGIN → Server checks credentials → Server creates session/token → Browser stores token → Every future request sends token → Server verifies token → Access granted",
                },
                {
                    type: "keypoints",
                    title: "The two main approaches",
                    points: [
                        "Sessions: Server stores who's logged in. Browser holds a session ID in a cookie. Simple, works great for traditional web apps.",
                        "JWT (JSON Web Tokens): Server issues a signed token. Browser stores it. Server doesn't need to remember anything — the token is self-contained. Great for APIs and mobile apps.",
                        "OAuth: You delegate authentication to a trusted provider (Google, GitHub). They verify the user and tell your app 'this person is who they say they are'. You never handle their password.",
                        "NextAuth handles all three for you. That's why we use it.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Map out the auth flow for a simple login form",
                        steps: [
                            "Draw a box for 'User' and a box for 'Server'",
                            "Draw an arrow: User sends email + password to Server",
                            "Server checks if email exists in database",
                            "Server checks if password matches the stored hash",
                            "If yes: Server creates a session and sends back a cookie",
                            "User's browser stores the cookie automatically",
                            "Next request: browser sends cookie → server reads it → user is authenticated",
                        ],
                        checkpoint: "You can explain the difference between a session and a JWT without looking it up.",
                    },
                },
            ],
        },
        {
            pathId: "auth",
            moduleIndex: 1,
            title: "NextAuth setup",
            emoji: "⚙️",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is NextAuth?",
                    body: "NextAuth is a library that handles authentication for Next.js apps. Instead of writing auth logic from scratch — session management, OAuth flows, token handling, database adapters — NextAuth gives you all of this in a few lines of config.",
                },
                {
                    type: "why",
                    title: "Why use NextAuth instead of writing it yourself?",
                    body: "Auth is one of the most security-sensitive parts of any app. Custom auth implementations almost always have vulnerabilities. NextAuth is maintained by a large team, battle-tested on millions of apps, and handles edge cases you'd never think of.",
                },
                {
                    type: "keypoints",
                    title: "The four things you configure",
                    points: [
                        "Providers: Who can log in? (GitHub, Google, email/password, etc.)",
                        "Adapter: Where do users get stored? (Prisma + your database)",
                        "Session strategy: Sessions (stored in DB) or JWT (stored in token)?",
                        "Secret: A random string that signs your tokens. Never expose this.",
                    ],
                },
                {
                    type: "concept",
                    title: "The route handler",
                    body: "NextAuth works through a single API route: /api/auth/[...nextauth]. The [...nextauth] is a catch-all — it handles /api/auth/signin, /api/auth/signout, /api/auth/callback/github, and every other auth endpoint automatically.",
                },
                {
                    type: "visual",
                    title: "File structure",
                    code: `app/
  api/
    auth/
      [...nextauth]/
        route.ts    ← all auth logic lives here
lib/
  prisma.ts         ← database client
.env
  NEXTAUTH_SECRET   ← random secret (openssl rand -base64 32)
  NEXTAUTH_URL      ← your app's URL`,
                    language: "bash",
                },
                {
                    type: "keypoints",
                    title: "What each env variable does",
                    points: [
                        "NEXTAUTH_SECRET: Signs and encrypts tokens. Required in production. Generate with: openssl rand -base64 32",
                        "NEXTAUTH_URL: The base URL of your app. NextAuth uses this to build callback URLs. In dev: http://localhost:3000. In prod: your actual domain.",
                        "GITHUB_ID / GITHUB_SECRET: From your GitHub OAuth App settings.",
                        "GOOGLE_ID / GOOGLE_SECRET: From Google Cloud Console OAuth credentials.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Verify your NextAuth setup is working",
                        steps: [
                            "Visit /api/auth/providers in your browser",
                            "You should see a JSON object listing your configured providers",
                            "Visit /api/auth/session — if not logged in, you'll see {}",
                            "Sign in with one of your providers",
                            "Visit /api/auth/session again — you should see your user object",
                        ],
                        checkpoint: "You can see your user data at /api/auth/session after signing in.",
                    },
                },
            ],
        },
        {
            pathId: "auth",
            moduleIndex: 2,
            title: "OAuth flow",
            emoji: "🔗",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is OAuth?",
                    body: "OAuth is a protocol that lets users log into your app using an account they already have — Google, GitHub, Apple, etc. You never see their password. Instead, the provider verifies who they are and tells your app 'this user is authenticated'.",
                },
                {
                    type: "analogy",
                    title: "Think of it like a background check",
                    body: "Imagine you're renting a flat and the landlord wants to verify your income. Instead of giving the landlord your bank statements directly, you give them a code they can use to request a verification from your bank. The bank confirms the info and the landlord never sees your full account. That's OAuth — the user authorises the provider to share specific info with your app.",
                },
                {
                    type: "visual",
                    title: "The OAuth flow step by step",
                    body: "1. User clicks 'Sign in with GitHub'\n2. Your app redirects to GitHub's login page\n3. User logs in on GitHub (you never see this)\n4. GitHub asks 'Allow this app to see your email and profile?'\n5. User clicks Allow\n6. GitHub redirects back to your app with a code\n7. Your app exchanges that code for an access token (server-side)\n8. Your app uses the token to fetch user's name and email\n9. User is now logged in",
                },
                {
                    type: "keypoints",
                    title: "Setting up GitHub OAuth",
                    points: [
                        "Go to github.com → Settings → Developer Settings → OAuth Apps → New OAuth App",
                        "Homepage URL: http://localhost:3000 (add your production URL too)",
                        "Authorization callback URL: http://localhost:3000/api/auth/callback/github",
                        "Copy the Client ID and generate a Client Secret",
                        "Add both to your .env as GITHUB_ID and GITHUB_SECRET",
                    ],
                },
                {
                    type: "keypoints",
                    title: "Setting up Google OAuth",
                    points: [
                        "Go to console.cloud.google.com → Create project",
                        "APIs & Services → Credentials → Create Credentials → OAuth Client ID",
                        "Application type: Web application",
                        "Authorised redirect URIs: http://localhost:3000/api/auth/callback/google",
                        "Copy Client ID and Client Secret to .env as GOOGLE_ID and GOOGLE_SECRET",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Test both OAuth providers",
                        steps: [
                            "Sign out of your app completely",
                            "Click 'Sign in with GitHub' — complete the flow",
                            "Check your database (Prisma Studio) — you should see a User and an Account row",
                            "Sign out, then try 'Sign in with Google'",
                            "Check the Account table — you should see two accounts, both linked to the same User if same email",
                        ],
                        checkpoint: "Both GitHub and Google sign-in create records in your User and Account tables.",
                    },
                },
            ],
        },
        {
            pathId: "auth",
            moduleIndex: 3,
            title: "Credentials auth",
            emoji: "📝",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "Email and password auth",
                    body: "Credentials auth is when users register with an email and password directly on your app. Unlike OAuth where a third party verifies identity, you're responsible for securely storing and verifying passwords. This means hashing — never store plain text passwords.",
                },
                {
                    type: "why",
                    title: "Why we hash passwords",
                    body: "If your database is ever breached (it happens to everyone eventually), hashed passwords are useless to an attacker. A hash is a one-way function — you can verify a password matches a hash, but you cannot reverse a hash back into the original password.",
                },
                {
                    type: "analogy",
                    title: "Hashing is like a fingerprint",
                    body: "A fingerprint uniquely identifies you, but you can't reconstruct a person from their fingerprint. bcrypt works the same way — it takes a password and produces a unique fingerprint. Every time a user logs in, you fingerprint the input and compare it to the stored fingerprint.",
                },
                {
                    type: "keypoints",
                    title: "bcrypt essentials",
                    points: [
                        "bcrypt.hash(password, saltRounds) — creates the hash. saltRounds=12 is a good default.",
                        "bcrypt.compare(plainPassword, hash) — returns true if they match, false if not.",
                        "Salt: bcrypt adds random data to each hash so two identical passwords produce different hashes. This defeats rainbow table attacks.",
                        "Never store the original password anywhere — not in logs, not in the database, not in memory longer than needed.",
                    ],
                },
                {
                    type: "visual",
                    title: "Registration vs login flow",
                    code: `// REGISTRATION
User submits email + password
→ Check if email already exists in DB
→ If yes: return error "Email already in use"
→ If no: hash the password with bcrypt
→ Store { email, hashedPassword } in DB
→ Redirect to login

// LOGIN  
User submits email + password
→ Find user by email in DB
→ If not found: return error
→ bcrypt.compare(submitted, storedHash)
→ If false: return error
→ If true: create session → user is logged in`,
                    language: "typescript",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Verify credentials auth is secure",
                        steps: [
                            "Register a new account with email + password",
                            "Open Prisma Studio → User table",
                            "Find your user — the password field should start with '$2b$' (that's bcrypt)",
                            "It should NOT be your actual password in plain text",
                            "Try logging in with wrong password — you should get an error",
                            "Try logging in with correct password — you should get in",
                        ],
                        checkpoint: "Your database stores a bcrypt hash, not your actual password.",
                    },
                },
            ],
        },
        {
            pathId: "auth",
            moduleIndex: 4,
            title: "Protected routes",
            emoji: "🛡️",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "What are protected routes?",
                    body: "A protected route is a page that only authenticated users can access. If you visit /dashboard without being logged in, the app should redirect you to /login. This is different from the auth itself — it's about controlling access after auth is set up.",
                },
                {
                    type: "keypoints",
                    title: "Two ways to protect routes in Next.js",
                    points: [
                        "Middleware (proxy.ts): Runs on every request before the page loads. Fast, runs at the edge. Best for protecting many routes at once.",
                        "Server component check: Call getServerSession() at the top of each page. Redirects if no session. More granular control.",
                        "For most apps: use middleware for broad protection + server-side check for per-page data fetching.",
                    ],
                },
                {
                    type: "visual",
                    title: "Middleware flow",
                    code: `// proxy.ts (runs before every request)
export async function proxy(request) {
  const token = await getToken({ req: request })
  
  const isProtected = request.nextUrl.pathname
    .startsWith('/dashboard')
    
  if (isProtected && !token) {
    // No token = not logged in = redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next() // proceed normally
}`,
                    language: "typescript",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Test your route protection",
                        steps: [
                            "Sign out completely",
                            "Try visiting /dashboard directly in the URL bar",
                            "You should be redirected to /login",
                            "Sign in",
                            "Visit /dashboard — you should get in",
                            "Open DevTools → Application → Cookies",
                            "You should see a next-auth.session-token cookie",
                        ],
                        checkpoint: "Visiting /dashboard while logged out redirects to /login.",
                    },
                },
            ],
        },
        {
            pathId: "auth",
            moduleIndex: 5,
            title: "Deploy securely",
            emoji: "🚀",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "What changes in production?",
                    body: "Locally, you can be looser with config. In production, secrets must be secret, URLs must be correct, and HTTPS is required. OAuth providers will refuse to work with misconfigured production URLs.",
                },
                {
                    type: "keypoints",
                    title: "Production checklist",
                    points: [
                        "NEXTAUTH_URL must be your production URL — not localhost. Example: https://myapp.vercel.app",
                        "NEXTAUTH_SECRET must be a long random string. Generate: openssl rand -base64 32",
                        "All OAuth callback URLs must be updated in GitHub and Google consoles to your production domain",
                        "DATABASE_URL must point to your production database (Neon, Supabase, etc.) not localhost",
                        "Never put secrets in your code or commit them to Git. Use environment variables always.",
                    ],
                },
                {
                    type: "keypoints",
                    title: "Vercel environment variables",
                    points: [
                        "Go to your Vercel project → Settings → Environment Variables",
                        "Add each variable: NEXTAUTH_URL, NEXTAUTH_SECRET, GITHUB_ID, GITHUB_SECRET, GOOGLE_ID, GOOGLE_SECRET, DATABASE_URL",
                        "Set scope to 'Production' for production values, 'Development' for local values",
                        "After adding vars, redeploy — Vercel doesn't auto-apply new env vars to existing deployments",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Verify your production deployment is secure",
                        steps: [
                            "Visit your production URL and try to sign in with Google",
                            "If you get redirect_uri_mismatch: add your production callback URL in Google Console",
                            "After successful sign in, visit /api/auth/session on your production URL",
                            "You should see your user object",
                            "Try visiting /dashboard while logged out on production — should redirect to /login",
                        ],
                        checkpoint: "Auth works on your production URL and routes are protected.",
                    },
                },
            ],
        },
    ],

    // ─── OSS PATH ──────────────────────────────────────────────────────────
    oss: [
        {
            pathId: "oss",
            moduleIndex: 0,
            title: "Git fundamentals",
            emoji: "📂",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "What is Git?",
                    body: "Git is a version control system. It tracks every change you make to your code, who made it, and when. Think of it as an unlimited undo button for your entire project — one that also lets multiple people work on the same codebase simultaneously without destroying each other's work.",
                },
                {
                    type: "analogy",
                    title: "Git is like Google Docs for code",
                    body: "In Google Docs, you can see the full edit history — who changed what and when, and you can revert to any previous version. Git does the same thing for code, but with much more control. You decide when to save a version (commit), what to name it, and which changes to include.",
                },
                {
                    type: "keypoints",
                    title: "The four commands you'll use 90% of the time",
                    points: [
                        "git add . — Stage all changed files (tell Git 'I want to save these changes')",
                        "git commit -m 'message' — Save a snapshot with a description of what changed",
                        "git push — Upload your commits to GitHub",
                        "git pull — Download the latest changes from GitHub to your machine",
                    ],
                },
                {
                    type: "visual",
                    title: "The Git workflow",
                    code: `Working directory  →  git add  →  Staging area
Staging area       →  git commit  →  Local repository  
Local repository   →  git push  →  Remote (GitHub)
Remote (GitHub)    →  git pull  →  Local repository`,
                    language: "bash",
                },
                {
                    type: "keypoints",
                    title: "Essential commands",
                    points: [
                        "git init — Start tracking a new project",
                        "git status — See what's changed and what's staged",
                        "git log --oneline — See your commit history in a compact view",
                        "git diff — See exactly what changed line by line",
                        "git clone <url> — Download a repository from GitHub",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Make your first meaningful commit",
                        steps: [
                            "In your project, make any small change to a file",
                            "Run: git status — see which files changed",
                            "Run: git add . — stage all changes",
                            "Run: git commit -m 'feat: describe what you changed'",
                            "Run: git log --oneline — see your commit in the history",
                            "Run: git push — upload to GitHub",
                        ],
                        checkpoint: "Your commit appears in your GitHub repository.",
                    },
                },
            ],
        },
        {
            pathId: "oss",
            moduleIndex: 1,
            title: "Branching & merging",
            emoji: "🌿",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is a branch?",
                    body: "A branch is an independent copy of your codebase where you can make changes safely. The main branch is your production code. You create a feature branch to build something new, work on it freely, and then merge it back when it's ready. This way, half-finished work never breaks your main branch.",
                },
                {
                    type: "analogy",
                    title: "Think of it like a Word document",
                    body: "Imagine you have a finished report. You want to try a different structure, but you don't want to ruin the original. So you make a copy, experiment on the copy, and if it works out, you replace the original with the improved version. Branches are that copy — but smarter, because Git can merge changes intelligently.",
                },
                {
                    type: "keypoints",
                    title: "Core branching commands",
                    points: [
                        "git branch feature/login — create a new branch called feature/login",
                        "git checkout feature/login — switch to that branch (or: git switch feature/login)",
                        "git checkout -b feature/login — create AND switch in one command",
                        "git merge feature/login — merge changes from feature/login into current branch",
                        "git branch -d feature/login — delete branch after merging",
                    ],
                },
                {
                    type: "concept",
                    title: "Merge conflicts",
                    body: "A conflict happens when two branches change the same line of code differently. Git can't decide which version to keep, so it asks you. It marks the conflict in the file with arrows (<<<<<<< and >>>>>>>). You manually choose which version to keep, delete the markers, and commit.",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Create a feature branch and merge it",
                        steps: [
                            "Run: git checkout -b feature/test-branch",
                            "Make a small change to any file",
                            "Commit: git add . && git commit -m 'test: add test change'",
                            "Switch back to main: git checkout main",
                            "Merge: git merge feature/test-branch",
                            "Delete the branch: git branch -d feature/test-branch",
                            "Push: git push",
                        ],
                        checkpoint: "You can create a branch, make changes, and merge it back to main.",
                    },
                },
            ],
        },
        {
            pathId: "oss",
            moduleIndex: 2,
            title: "GitHub workflow",
            emoji: "🐙",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "Git vs GitHub",
                    body: "Git is the tool that runs on your computer. GitHub is a website that hosts Git repositories online. Git doesn't require GitHub — but GitHub makes collaboration possible by giving everyone a shared place to push and pull code.",
                },
                {
                    type: "keypoints",
                    title: "Fork vs Clone",
                    points: [
                        "Clone: Download a repository you have write access to. Used for your own projects and team projects.",
                        "Fork: Create your own copy of someone else's repository on GitHub. Used for open source contributions — you make changes in your fork, then submit a PR to the original.",
                        "After forking: clone your fork locally, make changes, push to your fork, then open a PR to the original repo.",
                    ],
                },
                {
                    type: "keypoints",
                    title: "Remote management",
                    points: [
                        "git remote -v — see which remote repositories your local repo is connected to",
                        "origin — the default name for your fork on GitHub",
                        "upstream — the name for the original repo you forked from",
                        "git remote add upstream <url> — connect to the original repo so you can pull updates",
                        "git pull upstream main — get the latest changes from the original project",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Fork and contribute to a practice repo",
                        steps: [
                            "Go to github.com/firstcontributions/first-contributions",
                            "Click Fork in the top right",
                            "Clone your fork: git clone https://github.com/YOUR_USERNAME/first-contributions",
                            "Create a branch: git checkout -b add-your-name",
                            "Follow the repo instructions to add your name",
                            "Commit and push to your fork",
                            "Open a Pull Request from your fork to the original",
                        ],
                        checkpoint: "You have an open PR on a real GitHub repository.",
                    },
                },
            ],
        },
        {
            pathId: "oss",
            moduleIndex: 3,
            title: "Pull requests",
            emoji: "🔀",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is a pull request?",
                    body: "A pull request (PR) is a proposal to merge your branch into another branch. It's how teams review code before it goes into the main codebase. The name comes from requesting that someone 'pull' your changes in. On GitHub, PRs show exactly what changed, allow comments on specific lines, and track the review process.",
                },
                {
                    type: "keypoints",
                    title: "What makes a good PR",
                    points: [
                        "Small and focused: One PR = one thing. Don't mix unrelated changes.",
                        "Clear title: 'feat: add user authentication' not 'changes'",
                        "Description: What did you change? Why? How to test it?",
                        "Screenshots: For UI changes, include before/after screenshots",
                        "Self-review: Review your own diff before requesting review from others",
                    ],
                },
                {
                    type: "keypoints",
                    title: "Responding to review feedback",
                    points: [
                        "Don't take feedback personally — it's about the code, not you",
                        "Address every comment — either fix it or explain why you disagree",
                        "Push new commits to the same branch — the PR updates automatically",
                        "Resolve conversations after addressing them",
                        "Mark yourself as ready for re-review after making changes",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Open a well-structured PR on your own project",
                        steps: [
                            "Create a branch: git checkout -b feat/any-small-feature",
                            "Make a small but meaningful change",
                            "Push: git push -u origin feat/any-small-feature",
                            "On GitHub, click 'Compare & pull request'",
                            "Write a clear title and description",
                            "Add: What changed, why, and how to verify it works",
                            "Merge it yourself since it's your own repo",
                        ],
                        checkpoint: "You have a merged PR with a proper description in your repository.",
                    },
                },
            ],
        },
        {
            pathId: "oss",
            moduleIndex: 4,
            title: "Find issues",
            emoji: "🔍",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "How open source works",
                    body: "Open source projects are built by volunteers who contribute code, docs, tests, and bug reports. Most projects actively welcome contributors and label easy issues specifically for newcomers. You don't need to be an expert — you just need to find the right issue and follow the contribution guidelines.",
                },
                {
                    type: "keypoints",
                    title: "Where to find beginner issues",
                    points: [
                        "GitHub search: label:good-first-issue language:typescript — filter by language and label",
                        "goodfirstissue.dev — curated list of beginner-friendly issues",
                        "firstcontributions.github.io — step-by-step guide for first-timers",
                        "Your dependencies: the libraries you use every day always need contributors",
                        "Up for grabs (up-for-grabs.net) — categorised open source tasks",
                    ],
                },
                {
                    type: "keypoints",
                    title: "Before contributing",
                    points: [
                        "Read the CONTRIBUTING.md file — every project has different rules",
                        "Read the CODE_OF_CONDUCT.md — understand how the community operates",
                        "Comment on the issue before starting: 'I'd like to work on this. Here's my approach...'",
                        "Check if anyone else is already working on it",
                        "Ask questions in the issue if anything is unclear — maintainers prefer questions to wrong PRs",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Find 3 real open source issues you could contribute to",
                        steps: [
                            "Go to github.com/search?q=label:good-first-issue+language:typescript&type=issues",
                            "Filter by language you know (TypeScript, Python, etc.)",
                            "Read 5 issues and assess: do you understand what's being asked?",
                            "Pick 3 that seem doable in under 4 hours",
                            "Bookmark them — you'll submit one in the next module",
                        ],
                        checkpoint: "You have 3 bookmarked issues you could realistically tackle.",
                    },
                },
            ],
        },
        {
            pathId: "oss",
            moduleIndex: 5,
            title: "Your first PR",
            emoji: "🏆",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "This is the real thing",
                    body: "Everything in this path has led here. You're going to contribute to a real open source project — code that other people use, maintained by real developers, that will exist on GitHub permanently. This is what separates developers who have 'learned Git' from developers who actually use it.",
                },
                {
                    type: "keypoints",
                    title: "The contribution workflow",
                    points: [
                        "Fork the repository on GitHub",
                        "Clone your fork locally",
                        "Add upstream remote: git remote add upstream <original-repo-url>",
                        "Create a branch: git checkout -b fix/issue-description",
                        "Make your change — stay focused on exactly what the issue asks for",
                        "Test your change locally before pushing",
                        "Push to your fork: git push origin fix/issue-description",
                        "Open a PR — reference the issue: 'Closes #123'",
                    ],
                },
                {
                    type: "keypoints",
                    title: "What to write in your PR description",
                    points: [
                        "What the issue was: Briefly describe the problem",
                        "What you changed: Explain your solution at a high level",
                        "How to test it: Give the reviewer clear steps to verify your fix",
                        "Reference the issue: Include 'Closes #<issue-number>' so GitHub links them",
                        "Be patient: Maintainers are volunteers. Give them a week before following up.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Final exercise",
                    exercise: {
                        prompt: "Submit your first real open source PR",
                        steps: [
                            "Pick one of the 3 issues you bookmarked in the last module",
                            "Fork and clone the repository",
                            "Create a branch with a descriptive name",
                            "Implement the fix or feature",
                            "Test it works locally",
                            "Push and open a PR with a proper description",
                            "Share the PR link — you've contributed to open source",
                        ],
                        checkpoint: "You have an open PR on a real open source repository. That's it. That's the checkpoint.",
                    },
                },
            ],
        },
    ],

    // ─── FRAMEWORK PATH ─────────────────────────────────────────────────────
    framework: [
        {
            pathId: "framework",
            moduleIndex: 0,
            title: "React fundamentals",
            emoji: "⚛️",
            duration: "3 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is React?",
                    body: "React is a JavaScript library for building user interfaces. Instead of manipulating the DOM directly (which gets messy fast), you describe what the UI should look like and React figures out the most efficient way to update it. You write components — reusable pieces of UI — and compose them into full applications.",
                },
                {
                    type: "analogy",
                    title: "React components are like LEGO bricks",
                    body: "Each component is a self-contained brick: it has its own shape (JSX), its own colour (styles), and its own behaviour (logic). You build complex UIs by combining small, simple bricks. A Navbar is one brick. A Button is another. A LoginForm combines several bricks together.",
                },
                {
                    type: "keypoints",
                    title: "The three core concepts",
                    points: [
                        "Components: Functions that return JSX (HTML-like syntax). Everything in React is a component.",
                        "Props: Data passed into a component from its parent. Like function arguments. Read-only.",
                        "State: Data that lives inside a component and can change. When state changes, React re-renders the component.",
                    ],
                },
                {
                    type: "visual",
                    title: "Component anatomy",
                    code: `// A React component is just a function
function UserCard({ name, email }) {  // ← props as function params
  const [liked, setLiked] = useState(false)  // ← state
  
  return (  // ← JSX: what to render
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
      <button onClick={() => setLiked(!liked)}>
        {liked ? '❤️ Liked' : '🤍 Like'}
      </button>
    </div>
  )
}`,
                    language: "tsx",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Build a simple counter component",
                        steps: [
                            "Create a new file: components/Counter.tsx",
                            "Write a component with a count state starting at 0",
                            "Render the count and two buttons: + and -",
                            "+ increments count, - decrements it",
                            "Add it to any page and verify it works",
                        ],
                        checkpoint: "Your counter increments and decrements without page refresh.",
                    },
                },
            ],
        },
        {
            pathId: "framework",
            moduleIndex: 1,
            title: "Advanced hooks",
            emoji: "🪝",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What are hooks?",
                    body: "Hooks are functions that let you use React features (state, effects, context) inside function components. They always start with 'use'. useState and useEffect are the two you'll use most. Custom hooks let you extract and reuse logic across components.",
                },
                {
                    type: "keypoints",
                    title: "useEffect",
                    points: [
                        "Runs code after a component renders. Used for: fetching data, subscriptions, timers, DOM manipulation.",
                        "useEffect(() => { ... }, []) — runs once when component mounts (empty dependency array)",
                        "useEffect(() => { ... }, [value]) — runs when 'value' changes",
                        "useEffect(() => { return () => { cleanup } }, []) — cleanup runs when component unmounts",
                        "Common mistake: forgetting dependencies. If you use a variable inside useEffect, include it in the array.",
                    ],
                },
                {
                    type: "keypoints",
                    title: "useContext",
                    points: [
                        "Solves prop drilling — passing data through many component layers.",
                        "Create a context, wrap components in a Provider, consume with useContext.",
                        "Good for: theme, auth state, language, anything needed globally.",
                        "Don't use it for everything — component composition is often simpler.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Build a custom useLocalStorage hook",
                        steps: [
                            "Create hooks/useLocalStorage.ts",
                            "It should work like useState but persist to localStorage",
                            "Signature: useLocalStorage<T>(key: string, initialValue: T)",
                            "On mount, read from localStorage. On update, write to localStorage.",
                            "Test it: value should persist after page refresh",
                        ],
                        checkpoint: "Your hook persists state across page refreshes.",
                    },
                },
            ],
        },
    ],

    // ─── DB PATH ────────────────────────────────────────────────────────────
    db: [
        {
            pathId: "db",
            moduleIndex: 0,
            title: "SQL basics",
            emoji: "🗃️",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is a database?",
                    body: "A database is an organised collection of data stored so it can be accessed, managed, and updated efficiently. Think of a spreadsheet — but one that can store millions of rows, handle hundreds of users simultaneously, enforce rules about data integrity, and be queried with a powerful language called SQL.",
                },
                {
                    type: "analogy",
                    title: "A database is like a filing cabinet",
                    body: "Tables are the drawers. Each drawer (table) holds a specific type of document (record). The columns are the fields on each document — Name, Email, Date. SQL is the system you use to find, add, update, and remove documents.",
                },
                {
                    type: "keypoints",
                    title: "The queries you'll use daily",
                    points: [
                        "SELECT * FROM users — fetch all rows from the users table",
                        "SELECT name, email FROM users WHERE id = 1 — fetch specific columns where id is 1",
                        "INSERT INTO users (name, email) VALUES ('Sana', 'sana@example.com') — add a row",
                        "UPDATE users SET name = 'Sana A' WHERE id = 1 — update a row",
                        "DELETE FROM users WHERE id = 1 — delete a row",
                        "JOIN: combine data from multiple tables based on a related column",
                    ],
                },
                {
                    type: "visual",
                    title: "Understanding JOIN",
                    code: `-- users table        -- posts table
id | name            id | user_id | title
1  | Sana            1  |    1    | 'My first post'
2  | Ali             2  |    1    | 'Learning SQL'

-- JOIN: get each post with its author's name
SELECT users.name, posts.title
FROM posts
JOIN users ON posts.user_id = users.id

-- Result:
name  | title
Sana  | My first post
Sana  | Learning SQL`,
                    language: "sql",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Query your own database",
                        steps: [
                            "Open Prisma Studio (npx prisma studio)",
                            "Or open your database in a SQL client",
                            "Write a query to find all users",
                            "Write a query to find users created in the last 7 days",
                            "Write a query to count how many users have completed onboarding",
                        ],
                        checkpoint: "You can write SELECT queries with WHERE conditions against your own data.",
                    },
                },
            ],
        },
        {
            pathId: "db",
            moduleIndex: 1,
            title: "Postgres setup",
            emoji: "🐘",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "Why PostgreSQL?",
                    body: "PostgreSQL (Postgres) is the most feature-complete open-source relational database. It's used by companies of all sizes — from startups to Instagram and Apple. It supports complex queries, JSON, full-text search, and has decades of reliability. For web development, it's the default choice.",
                },
                {
                    type: "keypoints",
                    title: "Key Postgres concepts",
                    points: [
                        "Schemas: Namespaces within a database. Default schema is 'public'.",
                        "Transactions: Group multiple queries so they all succeed or all fail. Critical for data integrity.",
                        "Indexes: Speed up queries on frequently searched columns. Without them, every query scans the entire table.",
                        "Constraints: Rules enforced by the database — NOT NULL, UNIQUE, FOREIGN KEY. Prevents bad data.",
                        "ACID: Atomicity, Consistency, Isolation, Durability. Postgres guarantees all four.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Inspect your Postgres database",
                        steps: [
                            "Connect to your database using psql or a GUI like TablePlus/pgAdmin",
                            "Run: \\dt — list all tables",
                            "Run: \\d users — describe the users table structure",
                            "Run a SELECT query to see your actual data",
                            "Check which columns have indexes (look for PRIMARY KEY and UNIQUE)",
                        ],
                        checkpoint: "You can connect to and query your Postgres database directly.",
                    },
                },
            ],
        },
        {
            pathId: "db",
            moduleIndex: 2,
            title: "Prisma intro",
            emoji: "⚡",
            duration: "2 hrs",
            sections: [
                {
                    type: "concept",
                    title: "What is Prisma?",
                    body: "Prisma is an ORM (Object-Relational Mapper). Instead of writing raw SQL, you write TypeScript and Prisma translates it to SQL. You define your data structure in a schema file, and Prisma generates a fully-typed client — so your editor autocompletes every query and TypeScript catches type errors before they hit your database.",
                },
                {
                    type: "keypoints",
                    title: "The Prisma workflow",
                    points: [
                        "Define your schema in prisma/schema.prisma (models = tables, fields = columns)",
                        "Run: npx prisma migrate dev — creates the SQL migration and runs it",
                        "Run: npx prisma generate — generates the TypeScript client",
                        "Import and use: import { prisma } from '@/lib/prisma'",
                        "Query: await prisma.user.findMany() — fully typed, autocompleted",
                    ],
                },
                {
                    type: "visual",
                    title: "Schema → TypeScript types",
                    code: `// schema.prisma
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}

// Prisma generates this automatically:
type User = {
  id: string
  name: string
  email: string
}

// And these queries (all type-safe):
prisma.user.findMany()
prisma.user.findUnique({ where: { email: '...' } })
prisma.user.create({ data: { name: '...', email: '...' } })
prisma.user.update({ where: { id: '...' }, data: { name: '...' } })
prisma.user.delete({ where: { id: '...' } })`,
                    language: "typescript",
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Add a new model and query it",
                        steps: [
                            "Add a Note model to your schema: id, userId, content, createdAt",
                            "Run: npx prisma migrate dev --name add-notes",
                            "Run: npx prisma generate",
                            "In an API route, create a note for the logged-in user",
                            "In another route, fetch all notes for the logged-in user",
                            "Test both endpoints",
                        ],
                        checkpoint: "You can create and read Note records from your database through Prisma.",
                    },
                },
            ],
        },
    ],

    // ─── WEBAPP PATH ────────────────────────────────────────────────────────
    webapp: [
        {
            pathId: "webapp",
            moduleIndex: 0,
            title: "Project setup",
            emoji: "🏗️",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "What you're building",
                    body: "A full-stack web application has a frontend (what users see), a backend (server logic and APIs), and a database (where data lives). Next.js lets you build all three in one project. You don't need a separate Express server or a separate React app — it's all unified.",
                },
                {
                    type: "keypoints",
                    title: "Project structure you must understand",
                    points: [
                        "app/ — all your pages and API routes. Next.js reads this folder automatically.",
                        "app/page.tsx — your homepage (route: /)",
                        "app/dashboard/page.tsx — dashboard page (route: /dashboard)",
                        "app/api/users/route.ts — API endpoint (route: /api/users)",
                        "components/ — reusable UI components (shared across pages)",
                        "lib/ — utility functions, database client, helpers",
                        ".env — secret keys and config. Never commit this to Git.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Set up a new Next.js project from scratch",
                        steps: [
                            "Run: npx create-next-app@latest my-app --typescript --tailwind --app",
                            "cd my-app && npm run dev",
                            "Visit http://localhost:3000 — you should see the Next.js welcome page",
                            "Delete everything in app/page.tsx and replace with your own Hello World",
                            "Create a new page: app/about/page.tsx",
                            "Visit http://localhost:3000/about",
                        ],
                        checkpoint: "You have a running Next.js app with a custom homepage and an about page.",
                    },
                },
            ],
        },
    ],

    // ─── REALTIME PATH ──────────────────────────────────────────────────────
    realtime: [
        {
            pathId: "realtime",
            moduleIndex: 0,
            title: "HTTP vs WebSockets",
            emoji: "⚡",
            duration: "1 hr",
            sections: [
                {
                    type: "concept",
                    title: "The problem with HTTP for real-time",
                    body: "HTTP is request-response: client asks, server answers, connection closes. For a chat app, this means you'd have to ask the server 'any new messages?' every second. That's polling — inefficient, slow, and feels laggy. Real-time apps need a persistent connection where the server can push data whenever something happens.",
                },
                {
                    type: "analogy",
                    title: "HTTP vs WebSocket",
                    body: "HTTP is like sending a letter: you write it, send it, wait for a reply, get a reply, done. The post office doesn't contact you again until you send another letter. WebSocket is like a phone call: once connected, both sides can speak whenever they want. The line stays open.",
                },
                {
                    type: "keypoints",
                    title: "Three approaches to real-time",
                    points: [
                        "Polling: Client asks server every N seconds. Simple but inefficient. Fine for low-frequency updates.",
                        "Server-Sent Events (SSE): Server pushes updates to client over a persistent HTTP connection. One-way only. Great for notifications, live feeds.",
                        "WebSockets: Full duplex — both client and server can send messages anytime. Required for chat, multiplayer, collaborative editing.",
                    ],
                },
                {
                    type: "exercise",
                    title: "Mini exercise",
                    exercise: {
                        prompt: "Identify the right approach for different features",
                        steps: [
                            "For each feature, decide: polling, SSE, or WebSocket?",
                            "Live sports scores updating every 30 seconds → ?",
                            "Chat app where users message each other → ?",
                            "Progress bar for a long-running background job → ?",
                            "Collaborative document editing (like Google Docs) → ?",
                            "Dashboard that refreshes stats every 5 minutes → ?",
                        ],
                        checkpoint: "You can explain the tradeoffs between polling, SSE, and WebSockets.",
                    },
                },
            ],
        },
    ],
};