/* eslint-disable @typescript-eslint/no-explicit-any */



import { type NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import { compare } from "bcryptjs";

import { createClient } from "@supabase/supabase-js";

import {

  normalizeProgramType,

  type ProgramType,

} from "@/lib/programType";

import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";

import { normalizeRole } from "@/lib/roles";

import {

  normalizeEnrolledPrograms,

} from "@/lib/studentLoginRedirect";



function getSupabaseUrl() {

  return (process.env.SUPABASE_URL || "")

    .replace(/\/rest\/v1\/?$/i, "")

    .replace(/\/$/, "");

}



function getSupabase() {

  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY!, {

    auth: { persistSession: false, autoRefreshToken: false },

  });

}



function assertEnv() {

  const missing: string[] = [];

  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");

  if (!process.env.SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");

  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");

  if (missing.length) {

    throw new Error(`Missing env vars: ${missing.join(", ")}`);

  }

}



type DbUser = {

  id: string;

  name: string | null;

  email: string;

  role: string;

  programType: ProgramType;

  enrolledPrograms: string[];

};



async function fetchUserByEmail(email: string): Promise<DbUser | null> {

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) return null;

  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) return null;



  const supabase = getSupabase();

  let data: {

    id: string;

    name: string | null;

    email: string;

    role: string;

    program_type?: string | null;

    enrolled_programs?: unknown;

  } | null = null;

  let error: { message?: string } | null = null;



  const full = await supabase

    .from("users")

    .select("id, name, email, role, program_type, enrolled_programs")

    .eq("email", normalizedEmail)

    .maybeSingle();

  data = full.data;

  error = full.error;



  if (error?.message?.includes("column")) {

    const withProgram = await supabase

      .from("users")

      .select("id, name, email, role, program_type")

      .eq("email", normalizedEmail)

      .maybeSingle();

    if (!withProgram.error) {

      data = withProgram.data;

      error = null;

    } else {

      const basic = await supabase

        .from("users")

        .select("id, name, email, role")

        .eq("email", normalizedEmail)

        .maybeSingle();

      data = basic.data;

      error = basic.error;

    }

  }



  if (error || !data) return null;



  const role = normalizeRole(data.role);

  if (!role) return null;



  const programType = normalizeProgramType(data.program_type);

  const enrolledPrograms = normalizeEnrolledPrograms(
    data.enrolled_programs,
    programType
  );



  return {

    id: data.id,

    name: data.name ?? null,

    email: data.email ?? normalizedEmail,

    role,

    programType,

    enrolledPrograms,

  };

}



export function dashboardPathForSessionUser(user: {

  role?: string | null;

  programType?: string | null;

  enrolledPrograms?: unknown;

}): string {

  return dashboardPathForStudentUser(user);

}



const authBaseUrl = (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "").replace(
  /\/$/,
  ""
);
const useSecureCookies = authBaseUrl.startsWith("https://");

export const authOptions: NextAuthOptions = {

  secret: process.env.NEXTAUTH_SECRET,

  useSecureCookies,

  session: { strategy: "jwt" },

  pages: { signIn: "/login" },

  providers: [

    CredentialsProvider({

      name: "Credentials",

      credentials: {

        email: { label: "Email", type: "email" },

        password: { label: "Password", type: "password" },

      },

      async authorize(credentials) {

        try {

          assertEnv();



          const email = credentials?.email?.trim().toLowerCase();

          const password = credentials?.password;

          if (!email || !password) return null;



          const supabase = getSupabase();

          let data: {

            id: string;

            name: string | null;

            email: string;

            password: string;

            role: string;

            is_active?: boolean | null;

            must_change_password?: boolean | null;

            program_type?: string | null;

          } | null = null;

          let error: { message?: string } | null = null;



          const full = await supabase

            .from("users")

            .select(

              "id, name, email, password, role, is_active, must_change_password, program_type"

            )

            .eq("email", email)

            .maybeSingle();

          data = full.data;

          error = full.error;



          if (error?.message?.includes("column")) {

            const basic = await supabase

              .from("users")

              .select("id, name, email, password, role")

              .eq("email", email)

              .maybeSingle();

            data = basic.data;

            error = basic.error;

          }



          if (error || !data) return null;



          if (data.is_active === false) return null;



          const isValid =

            data.password?.startsWith("$2a$") || data.password?.startsWith("$2b$")

              ? await compare(password, data.password)

              : password === data.password;



          if (!isValid) return null;



          const role = normalizeRole(data.role);

          if (!role) return null;



          return {

            id: data.id,

            name: data.name ?? null,

            email: data.email ?? email,

            role,

            programType: normalizeProgramType(data.program_type),

            mustChangePassword: data.must_change_password === true,

          } as any;

        } catch (err) {

          console.error("[auth] credentials authorize failed:", err);

          return null;

        }

      },

    }),

  ],

  callbacks: {

    async jwt({ token, user }) {

      if (user) {

        const email = String((user as any).email ?? token.email ?? "")

          .trim()

          .toLowerCase();

        const dbUser = email ? await fetchUserByEmail(email) : null;



        if (dbUser) {

          token.id = dbUser.id;

          token.sub = dbUser.id;

          token.role = dbUser.role;

          token.email = dbUser.email;

          token.name = dbUser.name;

          (token as any).programType = dbUser.programType;

          (token as any).enrolledPrograms = dbUser.enrolledPrograms;

        } else {

          token.role = normalizeRole((user as any).role);

          token.id = (user as any).id;

          token.sub = (user as any).id ?? token.sub;

          token.email = (user as any).email ?? token.email;

          token.name = (user as any).name ?? token.name;

          (token as any).programType = normalizeProgramType(

            (user as any).programType

          );

        }



        if ((user as any).mustChangePassword === true) {

          (token as any).mustChangePassword = true;

        }

      }



      token.role = normalizeRole(token.role);

      if ((token as any).programType == null) {

        (token as any).programType = "ielts";

      }

      return token;

    },

    async session({ session, token }) {

      if (!session.user) {

        session.user = { email: "", name: null, image: null };

      }

      (session.user as any).role = normalizeRole((token as any).role);

      (session.user as any).id =

        (token as any).id ?? (token as any).sub ?? (session.user as any).id;

      (session.user as any).mustChangePassword =

        (token as any).mustChangePassword === true;

      (session.user as any).programType = normalizeProgramType(

        (token as any).programType

      );

      (session.user as any).enrolledPrograms = normalizeEnrolledPrograms(

        (token as any).enrolledPrograms,

        normalizeProgramType((token as any).programType)

      );

      if ((token as any).email) {

        session.user.email = (token as any).email as string;

      }

      if ((token as any).name) {

        session.user.name = (token as any).name as string;

      }

      return session;

    },

    async redirect({ url, baseUrl }) {

      if (url.startsWith("/")) return `${baseUrl}${url}`;

      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;

    },

  },

};



/** Server-side redirect path after login from Supabase role + program_type. */

export async function getDashboardPathForEmail(email: string) {

  const dbUser = await fetchUserByEmail(email);

  if (!dbUser) return null;

  return dashboardPathForStudentUser({

    role: dbUser.role,

    programType: dbUser.programType,

    enrolledPrograms: dbUser.enrolledPrograms,

  });

}


