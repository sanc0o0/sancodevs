"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
    const { data: session } = useSession();

    if (session) {
        return (
            <>
                <p>{session.user?.email}</p>
                <button type="button" onClick={() => signOut()}>
                    Logout
                </button>
            </>
        );
    }

    return (
        <>
            <button type="button" onClick={() => signIn("github")}>
                Sign in with GitHub
            </button>

            <button type="button" onClick={() => signIn("google")}>
                Sign in with Google
            </button>
        </>
    );
}