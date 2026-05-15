import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import { generateUniqueUsername } from "@/lib/username";

const adapter = PrismaAdapter(prisma);

adapter.createUser = async (
    data: Omit<AdapterUser, "id">
) => {

    if (!data.email) {
        throw new Error("Email is required");
    }

    const username = await generateUniqueUsername(data.email);

    return prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
            image: data.image,
            emailVerified: data.emailVerified,

            username,
        },
    });
};

export const authOptions: NextAuthOptions = {
    adapter,

    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) return null;

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    username: user.username,
                };
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, user }) {

            // Initial login
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
            }

            // OAuth fallback refresh
            if ((!token.username || !token.role) && token.email) {

                const dbUser = await prisma.user.findUnique({
                    where: {
                        email: token.email,
                    },
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.username = dbUser.username;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.username = token.username as string;
            }
            return session;
        },

        async redirect({ baseUrl }) {
            // After sign in, check if onboarded
            return baseUrl;
        },
    },

    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };