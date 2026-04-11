import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    return NextResponse.redirect(
        new URL(onboarding ? "/dashboard" : "/onboarding", req.url)
    );
}