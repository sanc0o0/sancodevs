import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    const isProtected = ["/dashboard", "/projects", "/applications"].some(
        (path) => request.nextUrl.pathname.startsWith(path)
    );

    if (isProtected && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/projects/:path*", "/applications/:path*", "/learn/:path*", "/community/:path*", "/profile/:path*"],
};