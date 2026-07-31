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

import { getAppBaseUrl } from "@/lib/appUrl";

import {

  normalizeEnrolledPrograms,

} from "@/lib/studentLoginRedirect";

import { hasDashboardAccess, requiresProgrammePayment } from "@/lib/payments/access";

import { fetchUserRowByEmail } from "@/lib/auth/userSelect";



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

  programType: ProgramType | null;

  enrolledPrograms: string[];

  stepEnrolled: boolean;

  onboardingCompleted: boolean;

  paymentStatus: string;

  paymentCompedUntil: string | null;

  programSelected: string | null;

  purchaseIntent: string | null;

  studentType: string;

};



async function fetchUserByEmail(email: string): Promise<DbUser | null> {

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) return null;

  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) return null;



  const supabase = getSupabase();

  const { data, error } = await fetchUserRowByEmail(supabase, normalizedEmail);



  if (error || !data) return null;



  const role = normalizeRole(data.role);

  if (!role) return null;



  const programType = normalizeProgramType(data.program_type);

  const enrolledPrograms = normalizeEnrolledPrograms(
    data.enrolled_programs,
    programType
  );

  const stepEnrolled = data.step_enrolled === true;

  const onboardingCompleted = data.onboarding_completed === true;

  const paymentStatus = String(data.payment_status ?? "unpaid").trim().toLowerCase() || "unpaid";

  const paymentCompedUntil = data.payment_comped_until ?? null;

  const programSelected = data.program_selected ?? null;

  const purchaseIntent = data.purchase_intent ?? null;

  const studentType = String(
    (data as { student_type?: string | null }).student_type ?? "self_study"
  );

  return {

    id: data.id,

    name: data.name ?? null,

    email: data.email ?? normalizedEmail,

    role,

    programType,

    enrolledPrograms,

    stepEnrolled,

    onboardingCompleted,

    paymentStatus,

    paymentCompedUntil,

    programSelected,

    purchaseIntent,

    studentType,

  };

}



function applyDbUserToAuthToken(token: Record<string, unknown>, dbUser: DbUser) {
  token.id = dbUser.id;
  token.sub = dbUser.id;
  token.role = dbUser.role;
  token.email = dbUser.email;
  token.name = dbUser.name;
  token.programType = dbUser.programType;
  token.enrolledPrograms = dbUser.enrolledPrograms;
  token.stepEnrolled = dbUser.stepEnrolled;
  token.onboardingCompleted = dbUser.onboardingCompleted;
  token.paymentStatus = dbUser.paymentStatus;
  token.paymentCompedUntil = dbUser.paymentCompedUntil;
  token.programSelected = dbUser.programSelected;
  token.purchaseIntent = dbUser.purchaseIntent;
  token.studentType = dbUser.studentType;
  token.hasDashboardAccess = hasDashboardAccess({
    role: dbUser.role,
    paymentStatus: dbUser.paymentStatus,
    paymentCompedUntil: dbUser.paymentCompedUntil,
    enrolledPrograms: dbUser.enrolledPrograms,
    programSelected: dbUser.programSelected,
    purchaseIntent: dbUser.purchaseIntent,
  });
  token.requiresPayment = requiresProgrammePayment({
    role: dbUser.role,
    enrolledPrograms: dbUser.enrolledPrograms,
    programSelected: dbUser.programSelected,
    purchaseIntent: dbUser.purchaseIntent,
  });
}



export function dashboardPathForSessionUser(user: {

  role?: string | null;

  programType?: string | null;

  enrolledPrograms?: unknown;

  stepEnrolled?: boolean;

  programSelected?: string | null;

}): string {

  return dashboardPathForStudentUser(user);

}



const authBaseUrl = (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "").replace(
  /\/$/,
  ""
);
const useSecureCookies =
  authBaseUrl.startsWith("https://") ||
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production";

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

          const { data, error } = await fetchUserRowByEmail(
            supabase,
            email,
            "password, is_active, must_change_password, email_verified_at, phone_verified_at, phone"
          );



          if (error || !data) return null;



          if (data.is_active === false) return null;



          // Only bcrypt-hashed passwords are ever accepted. Plaintext (or any
          // non-bcrypt) stored password is rejected by design so a misseeded
          // account can never authenticate with a cleartext value.
          const storedHash = data.password ?? "";

          const isBcryptHash = /^\$2[aby]\$/.test(storedHash);

          const isValid = isBcryptHash
            ? await compare(password, storedHash)
            : false;



          if (!isValid) return null;

          const emailVerified =
            data.email_verified_at === undefined || data.email_verified_at !== null;
          const phoneVerified =
            !data.phone ||
            data.phone_verified_at === undefined ||
            data.phone_verified_at !== null;

          if (!emailVerified || !phoneVerified) {
            throw new Error(
              "Please verify your email and phone before signing in. Check your inbox and WhatsApp/SMS."
            );
          }

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

    async jwt({ token, user, trigger, session }) {

      if (trigger === "update" && session) {
        if ((session as { onboardingCompleted?: boolean }).onboardingCompleted === true) {
          (token as any).onboardingCompleted = true;
        }
        if ((session as { programType?: string }).programType) {
          (token as any).programType = (session as { programType?: string }).programType;
        }
        if ((session as { enrolledPrograms?: unknown }).enrolledPrograms) {
          (token as any).enrolledPrograms = (
            session as { enrolledPrograms?: unknown }
          ).enrolledPrograms;
        }
        if ((session as { stepEnrolled?: boolean }).stepEnrolled === true) {
          (token as any).stepEnrolled = true;
        }
        if ((session as { hasDashboardAccess?: boolean }).hasDashboardAccess === true) {
          (token as any).hasDashboardAccess = true;
        }
        if ((session as { hasDashboardAccess?: boolean }).hasDashboardAccess === false) {
          (token as any).hasDashboardAccess = false;
        }
        if ((session as { paymentStatus?: string }).paymentStatus) {
          (token as any).paymentStatus = (session as { paymentStatus?: string }).paymentStatus;
        }
        if ((session as { paymentCompedUntil?: string | null }).paymentCompedUntil !== undefined) {
          (token as any).paymentCompedUntil = (
            session as { paymentCompedUntil?: string | null }
          ).paymentCompedUntil;
        }
        if ((session as { requiresPayment?: boolean }).requiresPayment === true) {
          (token as any).requiresPayment = true;
        }
      }

      const email = String((token as any).email ?? (user as { email?: string } | undefined)?.email ?? "")
        .trim()
        .toLowerCase();

      if (email) {
        const dbUser = await fetchUserByEmail(email);
        if (dbUser) {
          applyDbUserToAuthToken(token as Record<string, unknown>, dbUser);
        } else if (user) {
          token.role = normalizeRole((user as any).role);
          token.id = (user as any).id;
          token.sub = (user as any).id ?? token.sub;
          token.email = (user as any).email ?? token.email;
          token.name = (user as any).name ?? token.name;
          (token as any).programType = normalizeProgramType((user as any).programType);
        }
      } else if (user) {
        token.role = normalizeRole((user as any).role);
        token.id = (user as any).id;
        token.sub = (user as any).id ?? token.sub;
        token.email = (user as any).email ?? token.email;
        token.name = (user as any).name ?? token.name;
        (token as any).programType = normalizeProgramType((user as any).programType);
      }

      if (user && (user as { mustChangePassword?: boolean }).mustChangePassword === true) {
        (token as any).mustChangePassword = true;
      }

      token.role = normalizeRole(token.role);

      return token;
    },

    async session({ session, token }) {

      if (!session.user) {

        session.user = { email: "", name: null, image: null };

      }

      const email = String(
        session.user?.email ?? (token as any).email ?? ""
      )
        .trim()
        .toLowerCase();

      let programType = normalizeProgramType((token as any).programType);
      let enrolledPrograms = normalizeEnrolledPrograms(
        (token as any).enrolledPrograms,
        programType
      );
      let programSelected = (token as any).programSelected ?? null;
      let purchaseIntent = (token as any).purchaseIntent ?? null;
      let paymentStatus = (token as any).paymentStatus ?? "unpaid";
      let paymentCompedUntil = (token as any).paymentCompedUntil ?? null;
      let onboardingCompleted = (token as any).onboardingCompleted === true;
      let stepEnrolled = (token as any).stepEnrolled === true;

      if (email) {
        const dbUser = await fetchUserByEmail(email);
        if (dbUser) {
          programType = dbUser.programType;
          enrolledPrograms = normalizeEnrolledPrograms(
            dbUser.enrolledPrograms,
            dbUser.programType
          );
          programSelected = dbUser.programSelected;
          purchaseIntent = dbUser.purchaseIntent;
          paymentStatus = dbUser.paymentStatus;
          paymentCompedUntil = dbUser.paymentCompedUntil;
          onboardingCompleted = dbUser.onboardingCompleted;
          stepEnrolled = dbUser.stepEnrolled;
        }
      }

      (session.user as any).role = normalizeRole((token as any).role);

      (session.user as any).id =

        (token as any).id ?? (token as any).sub ?? (session.user as any).id;

      (session.user as any).mustChangePassword =

        (token as any).mustChangePassword === true;

      (session.user as any).programType = programType;

      (session.user as any).studentType = (token as any).studentType ?? "self_study";

      (session.user as any).enrolledPrograms = enrolledPrograms;

      (session.user as any).stepEnrolled = stepEnrolled;

      (session.user as any).onboardingCompleted = onboardingCompleted;

      (session.user as any).paymentStatus = paymentStatus;

      (session.user as any).hasDashboardAccess = hasDashboardAccess({
        role: normalizeRole((token as any).role),
        paymentStatus,
        paymentCompedUntil,
        enrolledPrograms,
        programSelected,
        purchaseIntent,
      });

      (session.user as any).requiresPayment = requiresProgrammePayment({
        role: normalizeRole((token as any).role),
        enrolledPrograms,
        programSelected,
        purchaseIntent,
      });

      (session.user as any).purchaseIntent = purchaseIntent;

      (session.user as any).programSelected = programSelected;

      if ((token as any).email) {

        session.user.email = (token as any).email as string;

      }

      if ((token as any).name) {

        session.user.name = (token as any).name as string;

      }

      return session;

    },

    async redirect({ url, baseUrl }) {
      const root = getAppBaseUrl() || baseUrl;

      if (url.startsWith("/")) return `${root}${url}`;

      try {
        if (new URL(url).origin === new URL(root).origin) return url;
      } catch {
        /* ignore malformed url */
      }

      return root;
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

    stepEnrolled: dbUser.stepEnrolled,

    programSelected: dbUser.programSelected,

  });

}


