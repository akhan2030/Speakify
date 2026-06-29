import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "admin";
};

async function readAuthToken() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const cookieStore = cookies();
  const headerStore = headers();
  const cookieHeader = cookieStore.toString();

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
        ...Object.fromEntries(headerStore.entries()),
      },
    } as Parameters<typeof getToken>[0]["req"],
    secret,
  });

  if (token) return token;

  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    sub: (session.user as { id?: string }).id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as { role?: string }).role,
  };
}

async function loadAdminFromDatabase(email: string): Promise<AdminSessionUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, is_active")
    .eq("email", normalized)
    .maybeSingle();

  if (error || !data) return null;
  if (data.is_active === false) return null;
  if (normalizeRole(data.role) !== "admin") return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name ?? null,
    role: "admin",
  };
}

export async function requireAdminSession() {
  const token = await readAuthToken();
  const email = String(token?.email ?? "").trim().toLowerCase();

  if (!email) {
    return { session: null, user: null, error: "Unauthorized" as const, status: 401 as const };
  }

  const user = await loadAdminFromDatabase(email);
  if (!user) {
    return {
      session: null,
      user: null,
      error: "Forbidden" as const,
      status: 403 as const,
    };
  }

  return {
    session: { user },
    user,
    error: null,
    status: null,
  };
}
