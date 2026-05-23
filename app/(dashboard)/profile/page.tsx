// app/(dashboard)/profile/page.tsx
// Redirects to /user/username (no @ — @ conflicts with Next.js parallel routes)

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { username: true },
    });

    if (!user?.username) redirect("/login");

    // /user/username — NO @ prefix (@ breaks Next.js routing)
    redirect(`/user/${user.username}`);
}