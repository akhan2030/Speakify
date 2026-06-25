import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: string | null;
      programType?: string | null;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    role?: string | null;
    programType?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string | null;
    programType?: string | null;
    mustChangePassword?: boolean;
  }
}

export {};
