import { notFound } from "next/navigation";
import PageHero from "@/components/marketing/PageHero";
import Link from "next/link";

const posts: Record<string, {
    title: string; date: string; tag: string;
    content: { heading?: string; body: string }[];
}> = {
    "why-most-devs-quit": {
        title: "Why most developers quit before they get good",
        date: "Apr 10, 2026",
        tag: "Learning",
        content: [
            { body: "Learning to code is one of the most asymmetric skills you can acquire. The ceiling is enormous — software developers are among the highest-paid professionals in the world, and the tools you build can reach millions of people. Yet the dropout rate is staggering. Most people who start quit within the first three months." },
            { heading: "The tutorial trap", body: "The most common pattern we see is what we call the tutorial trap. A beginner watches a 10-hour YouTube course, follows along perfectly, and feels great. Then they close the video and try to build something — and freeze. Nothing comes out. The problem isn't intelligence or motivation. It's that passive consumption never translates to active construction. You can watch someone do push-ups forever without getting stronger." },
            { heading: "The missing consequence", body: "The second killer is the absence of accountability. With traditional education, quitting has a cost — a failed grade, lost tuition, a disappointed teacher. Online learning removes all of that friction. And friction, it turns out, is exactly what keeps you going. When quitting is costless, it happens constantly." },
            { heading: "What actually works", body: "The developers who make it through have two things in common: they build things before they feel ready, and they have some form of external accountability — a community, a cohort, a deadline. SancoDevs is built around both. We push you to build from day one, and we make quitting visible." },
            { heading: "Start before you're ready", body: "The biggest lie in developer education is that you need to learn more before you can build. You don't. You need to build more so you can learn. Pick something small, start today, and let the gaps in your knowledge reveal themselves. That's the fastest curriculum there is." },
        ],
    },
    "git-is-not-optional": {
        title: "Git is not optional — it's the first professional skill",
        date: "Apr 5, 2026",
        tag: "Git",
        content: [
            { body: "Ask any hiring manager what separates junior developers who thrive from those who struggle, and Git comes up constantly. Not React. Not TypeScript. Not system design. Git — the most unglamorous tool in the stack." },
            { heading: "Why nobody teaches it properly", body: "Most courses treat Git as an afterthought. They show you git init and git commit and move on. They don't teach branching strategies, conflict resolution, PR etiquette, or how to read a git log like a professional. These are the skills you actually need on day one of a job." },
            { heading: "The real cost of not knowing Git", body: "Developers who don't know Git properly are a liability on a team. They break shared branches, lose work, and slow down everyone around them. It's not a minor gap — it's a fundamental professional skill, like knowing how to structure an email or run a meeting." },
            { heading: "What you actually need to know", body: "The core skills are: branching (create, switch, merge, rebase), commit discipline (small commits, clear messages), PR workflow (fork, push, open PR, respond to review), and conflict resolution. None of these are hard. They just require deliberate practice — which almost no learning platform provides." },
            { heading: "How we approach it", body: "At SancoDevs, Git is embedded in every learning path — not as a standalone module you skip. You use it from module one. By the time you finish your path, you've made dozens of commits, opened at least one PR, and contributed to a real repository. That's the only way it sticks." },
        ],
    },
    "accountability-in-learning": {
        title: "Why accountability is the missing ingredient in online learning",
        date: "Mar 28, 2026",
        tag: "Product",
        content: [
            { body: "The online education market is worth hundreds of billions of dollars. Udemy, Coursera, YouTube, freeCodeCamp — the content has never been better or more accessible. And yet, completion rates for online courses hover between 3% and 15%. Something fundamental is broken." },
            { heading: "Content was never the problem", body: "For the last decade, the dominant assumption in EdTech was that if you made content better — higher production quality, more engaging instructors, better exercises — people would learn more. That assumption was wrong. The content was never the bottleneck. The bottleneck is commitment." },
            { heading: "What bootcamps got right", body: "Bootcamps, despite their problems, figured something out early: putting $10,000 on the table changes behaviour. Not because of the money itself, but because of the social and psychological weight of a visible commitment. You've told people you're doing this. You've rearranged your life. Quitting is no longer frictionless." },
            { heading: "Accountability at scale", body: "The challenge is building accountability without the $10,000 price tag. At SancoDevs, we approach this through project commitments. When you choose a project, you're not just picking a tutorial — you're making a declaration. Your progress is visible. Abandonment has a cost in the form of lost progress and a public record." },
            { heading: "The team layer", body: "The most powerful accountability, though, is social. When someone is depending on you to push your branch, review their PR, or show up to a planning call — you show up. Team projects on SancoDevs are designed with this in mind. You're not just learning in isolation. You're working with someone who needs you to deliver." },
        ],
    },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = posts[slug];
    if (!post) notFound();

    return (
        <>
            <div style={{ maxWidth: "680px", margin: "0 auto", padding: "4rem 2rem 1rem" }}>
                <Link href="/blog" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>
                    ← Back to blog
                </Link>
            </div>
            <PageHero title={post.title} sub={`${post.tag} · ${post.date}`} />
            <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                {post.content.map((block, i) => (
                    <div key={i} style={{ marginBottom: "1.75rem" }}>
                        {block.heading && (
                            <h2 style={{
                                fontSize: "16px", fontWeight: 500, color: "var(--text)",
                                marginBottom: "8px",
                            }}>{block.heading}</h2>
                        )}
                        <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.85 }}>{block.body}</p>
                    </div>
                ))}

                <div style={{
                    marginTop: "3rem", paddingTop: "2rem",
                    borderTop: "0.5px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: "1rem",
                }}>
                    <Link href="/blog" style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "none" }}>
                        ← All posts
                    </Link>
                    <Link href="/signup" style={{
                        padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
                        background: "var(--accent)", color: "var(--bg)",
                        textDecoration: "none", fontWeight: 500,
                    }}>
                        Start learning on SancoDevs →
                    </Link>
                </div>
            </div>
        </>
    );
}

export async function generateStaticParams() {
    return Object.keys(posts).map(slug => ({ slug }));
}