import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string;
      fabPixelSprite?: string | null;
      role?: Role;
    };
  }

  interface User {
    id: string;
    username?: string;
    fabPixelSprite?: string | null;
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: Role;
  }
}
