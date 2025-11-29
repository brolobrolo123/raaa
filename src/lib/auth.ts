import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { loginSchema } from "./validators";

type SessionUser = User & { id: string };

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
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
        const normalized = credential.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: normalized }, { username: normalized }],
          },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) {
          return null;
        }

        const nextUser: SessionUser = {
          id: user.id,
          email: user.email ?? undefined,
          name: user.username,
          username: user.username,
          image: user.image ?? undefined,
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
      } else if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, username: true, image: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.image = dbUser.image;
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
      }
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
