import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { loginSchema } from "./validators";
import type { Role } from "@/types/roles";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

type SessionUser = User & { id: string; role?: Role };

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        credential: { label: "Usuario o correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { credential, password } = parsed.data;
        const sanitizedCredential = credential.trim();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: sanitizedCredential, mode: "insensitive" } },
              { username: { equals: sanitizedCredential, mode: "insensitive" } },
            ],
          },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) {
          return null;
        }

        const now = new Date();
        if (user.permanentBan || (user.bannedUntil && user.bannedUntil > now)) {
          const suffix = user.banReason ? ` Motivo: ${user.banReason}` : "";
          const message = user.permanentBan
            ? `Tu cuenta fue baneada permanentemente.${suffix}`
            : `Tu cuenta está baneada hasta ${user.bannedUntil?.toLocaleString()}.${suffix}`;
          throw new Error(message);
        }

        const nextUser: SessionUser = {
          id: user.id,
          email: user.email ?? undefined,
          name: user.username,
          username: user.username,
          image: user.image ?? undefined,
          role: user.role,
        };

        return nextUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user && typeof user.id === "string") {
          const typedUser = user as SessionUser;
          token.id = typedUser.id;
          token.username = typedUser.username ?? typedUser.name ?? token.username;
          token.image = typedUser.image ?? token.image;
          token.role = typedUser.role ?? token.role;
      } else if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, username: true, image: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.image = dbUser.image;
        }
      }
      if (token.id) {
        const exists = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true },
        });
        if (!exists) {
          delete token.id;
          delete token.username;
          delete token.image;
          delete token.role;
        }
      }
      return token;
    },
    session({ session, token }) {
          if (session.user) {
            session.user.id = token.id as string;
            session.user.username = (token.username as string) ?? session.user.name ?? "";
            if (token.image) {
              session.user.image = token.image as string;
            }
            session.user.role = (token.role as Role) ?? session.user.role;
      }
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
