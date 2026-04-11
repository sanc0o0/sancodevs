import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const existing = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (existing) redirect("/dashboard");

    return <OnboardingClient />;
}