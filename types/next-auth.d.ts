import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {

    interface Session {
        user: {
            id: string;
            role: string;
            username: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        username: string;
    }
}

declare module "next-auth/jwt" {

    interface JWT extends DefaultJWT {
        id: string;
        role: string;
        username: string;
    }
}