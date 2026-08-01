/**
 * Standing routing / entitlement regression suite.
 *
 * Accounts:
 *  - STEP-only (step.beta)
 *  - GT-only (seeded or provisioned)
 *  - mock-only pack3 (mock.pack3.clean)
 *  - paid/comped Accelerator (jood)
 *
 * Also asserts pure unit cases for empty enrollment + program_type=ielts.
 *
 * Run:  node scripts/routing-regression.mjs
 * Prod: PROOF_BASE_URL=https://ielts-ai-tutor-neon.vercel.app node scripts/routing-regression.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

dotenv.config({ path: ".env.local", quiet: true });

const require = createRequire(import.meta.url);

// Load compiled-ish TS via tsx if available; otherwise run unit checks inline.
async function loadRoutingFns() {
  try {
    const mod = await import("../lib/studentLoginRedirect.ts");
    const prog = await import("../lib/programType.ts");
    const mock = await import("../lib/mock-test/mockAccess.ts");
    return {
      resolveStudentDashboardPath: mod.resolveStudentDashboardPath,
      normalizeEnrolledPrograms: mod.normalizeEnrolledPrograms,
      resolveStudentProgramType: prog.resolveStudentProgramType,
      hasAllAcademicMockAccess: mock.hasAllAcademicMockAccess,
      hasMockExamStartAccess: mock.hasMockExamStartAccess,
    };
  } catch {
    // Fallback: spawn tsx helper
    return null;
  }
}

const BASE = (
  process.env.PROOF_BASE_URL || "https://ielts-ai-tutor-neon.vercel.app"
).replace(/\/$/, "");

const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "output",
  "routing-regression"
);

const ACCOUNTS = {
  step: {
    label: "STEP-only",
    email: "step.beta@speakify.demo",
    password: "StepBeta@2026",
    expectDashboardIncludes: ["/dashboard/step"],
    expectNotDashboard: ["/dashboard/ielts/student"],
    expectHasAllMocks: false,
    expectStartableMocks: [1, 2, 3, 4, 5], // owns pack5 purchases
  },
  pack3: {
    label: "mock-only pack3",
    email: "mock.pack3.clean@speakify.test",
    password: "Pack3Clean!2026",
    // Session path may be Academic home; middleware forces mock lobby for mock-product accounts.
    expectDashboardIncludes: ["/dashboard/ielts"],
    expectHasAllMocks: false,
    expectStartableMocks: [1, 2, 3],
    expectLockedMocks: [4, 5],
    expectMiddlewareMockLobby: true,
  },
  accelerator: {
    label: "paid Accelerator (Jood)",
    email: "jood@speakify.demo",
    password: "Jood@Speakify2026",
    expectDashboardIncludes: ["/dashboard/ielts/student"],
    expectHasAllMocks: true,
    expectStartableMocks: [1, 2, 3, 4, 5],
  },
};

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cookieJar() {
  const jar = {};
  return {
    store(res) {
      const raw = res.headers.getSetCookie?.() ?? [];
      for (const line of raw) {
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1);
      }
    },
    header() {
      return Object.entries(jar)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    },
  };
}

async function login(email, password) {
  const jar = cookieJar();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar.store(csrfRes);
  const { csrfToken } = await csrfRes.json();
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jar.header(),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: "true",
      redirect: "false",
    }),
    redirect: "manual",
  });
  jar.store(loginRes);
  return jar;
}

async function apiGet(jar, pathname) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { Cookie: jar.header() },
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, location: res.headers.get("location"), json, text: text.slice(0, 400) };
}

async function ensureGtAccount(sb) {
  const email = "gt.routing.regression@speakify.test";
  const password = "GtRouting!2026";
  const { data: existing } = await sb.from("users").select("id").eq("email", email).maybeSingle();
  const userId = existing?.id ?? randomUUID();
  const hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const row = {
    name: "GT Routing Regression",
    email,
    password: hash,
    role: "student",
    is_active: true,
    program_type: "ielts_general",
    program_selected: "ielts_general",
    enrolled_programs: ["ielts_general"],
    purchase_intent: null,
    payment_status: "comped",
    payment_comped_until: "2099-12-31T23:59:59.000Z",
    onboarding_completed: true,
    placement_test_completed: true,
    email_verified_at: now,
    phone_verified_at: now,
    must_change_password: false,
  };
  if (existing?.id) {
    await sb.from("users").update(row).eq("id", userId);
  } else {
    await sb.from("users").insert({ id: userId, ...row });
  }
  return {
    label: "GT-only",
    email,
    password,
    expectDashboardIncludes: ["/dashboard/ielts-general/student"],
    expectNotDashboard: ["/dashboard/ielts/student"],
    expectHasAllMocks: false,
    expectStartableMocks: [],
  };
}

async function runUnitChecks(fns) {
  const checks = [];
  const push = (name, ok, detail) => checks.push({ name, ok, detail });

  // Empty enrollment + program_type ielts must NOT invent IELTS enrollment
  const empty = fns.normalizeEnrolledPrograms([], "ielts");
  push(
    "empty enrollment does not invent IELTS",
    Array.isArray(empty) && empty.length === 0,
    { empty }
  );

  const dash = fns.resolveStudentDashboardPath({
    programType: "ielts",
    enrolledPrograms: [],
    programSelected: null,
  });
  push(
    "empty enrollment + program_type=ielts → programme picker",
    dash === "/dashboard/home",
    { dash }
  );

  const stepDash = fns.resolveStudentDashboardPath({
    programType: "ielts", // leftover DB default
    enrolledPrograms: ["step"],
    programSelected: "step",
    stepEnrolled: true,
  });
  push(
    "STEP-only with leftover program_type=ielts → STEP home",
    String(stepDash).includes("/dashboard/step"),
    { stepDash }
  );

  const gtDash = fns.resolveStudentDashboardPath({
    programType: "ielts",
    enrolledPrograms: ["ielts_general"],
    programSelected: "ielts_general",
  });
  push(
    "GT-only → GT dashboard",
    gtDash === "/dashboard/ielts-general/student",
    { gtDash }
  );

  const mockOnly = {
    role: "student",
    paymentStatus: "unpaid",
    purchaseIntent: "mock_only",
    enrolledPrograms: ["ielts"],
    programSelected: "ielts",
  };
  push(
    "mock_only does not get all Academic mocks",
    fns.hasAllAcademicMockAccess(mockOnly) === false,
    {}
  );
  push(
    "mock_only pack3 can start 1-3 only",
    fns.hasMockExamStartAccess(mockOnly, 1, [1, 2, 3]) === true &&
      fns.hasMockExamStartAccess(mockOnly, 4, [1, 2, 3]) === false,
    {}
  );

  const paid = {
    role: "student",
    paymentStatus: "paid",
    purchaseIntent: "accelerator",
    enrolledPrograms: ["ielts"],
    programSelected: "ielts",
  };
  push(
    "paid Accelerator gets all mocks",
    fns.hasAllAcademicMockAccess(paid) === true,
    {}
  );

  return checks;
}

async function checkAccount(account) {
  const jar = await login(account.email, account.password);
  const me = await apiGet(jar, "/api/auth/me");
  const pageData = await apiGet(jar, "/api/student/mock-exam/page-data");

  const dashboardPath = me.json?.dashboardPath ?? null;
  const mocks = (pageData.json?.availableMocks ?? []).map((m) => ({
    n: m.mockNumber,
    canStart: m.canStart === true,
  }));
  const startable = mocks.filter((m) => m.canStart).map((m) => m.n);
  const locked = mocks.filter((m) => !m.canStart).map((m) => m.n);
  const hasAllMocks = pageData.json?.access?.hasAllMocks === true;

  const pathOk = (account.expectDashboardIncludes ?? []).every((p) =>
    String(dashboardPath ?? "").startsWith(p) || String(dashboardPath ?? "").includes(p)
  );
  const notPathOk = (account.expectNotDashboard ?? []).every(
    (p) => !String(dashboardPath ?? "").startsWith(p)
  );
  const startOk =
    JSON.stringify(startable) === JSON.stringify(account.expectStartableMocks ?? startable);
  const lockedOk =
    !account.expectLockedMocks ||
    account.expectLockedMocks.every((n) => locked.includes(n));
  const allMocksOk =
    account.expectHasAllMocks == null || hasAllMocks === account.expectHasAllMocks;

  // Session create for a locked mock if any
  let sessionProbe = null;
  if (account.expectLockedMocks?.length) {
    const n = account.expectLockedMocks[0];
    const res = await fetch(`${BASE}/api/mock-test/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: jar.header(),
      },
      body: JSON.stringify({ mockNumber: n, examVariant: "academic" }),
    });
    const body = await res.json().catch(() => ({}));
    sessionProbe = { status: res.status, body };
  }

  // Middleware: mock-only primary accounts hitting Academic home → mock lobby
  let middlewareProbe = null;
  if (account.expectMiddlewareMockLobby) {
    const res = await fetch(`${BASE}/dashboard/ielts/student`, {
      headers: { Cookie: jar.header() },
      redirect: "manual",
    });
    middlewareProbe = {
      status: res.status,
      location: res.headers.get("location"),
    };
  }

  const middlewareOk =
    !account.expectMiddlewareMockLobby ||
    (middlewareProbe &&
      (String(middlewareProbe.location ?? "").includes("/mock-exam") ||
        middlewareProbe.status === 307 ||
        middlewareProbe.status === 302));

  const ok =
    me.status === 200 &&
    pathOk &&
    notPathOk &&
    pageData.status === 200 &&
    startOk &&
    lockedOk &&
    allMocksOk &&
    middlewareOk &&
    (sessionProbe == null || sessionProbe.status === 403);

  return {
    label: account.label,
    email: account.email,
    ok,
    me: { status: me.status, dashboardPath, enrolledPrograms: me.json?.enrolledPrograms },
    mocks: { hasAllMocks, startable, locked, purchased: pageData.json?.access?.purchasedMockNumbers },
    sessionProbe,
    middlewareProbe,
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    unit: [],
    accounts: [],
  };

  // Unit checks via npx tsx inline script for reliability
  const { spawnSync } = await import("node:child_process");
  const unitScript = `
    import { resolveStudentDashboardPath, normalizeEnrolledPrograms } from "./lib/studentLoginRedirect.ts";
    import { hasAllAcademicMockAccess, hasMockExamStartAccess } from "./lib/mock-test/mockAccess.ts";
    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    push("empty enrollment does not invent IELTS", normalizeEnrolledPrograms([], "ielts").length === 0, {});
    push("empty + program_type=ielts → picker", resolveStudentDashboardPath({ programType: "ielts", enrolledPrograms: [] }) === "/dashboard/home", { path: resolveStudentDashboardPath({ programType: "ielts", enrolledPrograms: [] }) });
    push("STEP leftover program_type=ielts → STEP", String(resolveStudentDashboardPath({ programType: "ielts", enrolledPrograms: ["step"], programSelected: "step", stepEnrolled: true })).includes("/dashboard/step"), {});
    push("GT-only → GT", resolveStudentDashboardPath({ programType: "ielts", enrolledPrograms: ["ielts_general"], programSelected: "ielts_general" }) === "/dashboard/ielts-general/student", {});
    const mockOnly = { role: "student", paymentStatus: "unpaid", purchaseIntent: "mock_only", enrolledPrograms: ["ielts"], programSelected: "ielts" };
    push("mock_only not all mocks", hasAllAcademicMockAccess(mockOnly) === false, {});
    push("pack3 locks #4", hasMockExamStartAccess(mockOnly, 4, [1,2,3]) === false, {});
    const paid = { role: "student", paymentStatus: "paid", purchaseIntent: "accelerator", enrolledPrograms: ["ielts"], programSelected: "ielts" };
    push("paid Accelerator all mocks", hasAllAcademicMockAccess(paid) === true, {});
    console.log(JSON.stringify(checks));
  `;
  const unitFile = path.join(outDir, "_unit-temp.mts");
  await writeFile(unitFile, unitScript);
  const unitRun = spawnSync("npx", ["tsx", unitFile], {
    cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
    encoding: "utf8",
    shell: true,
  });
  if (unitRun.status === 0) {
    report.unit = JSON.parse(unitRun.stdout.trim().split("\n").pop());
  } else {
    report.unit = [{ name: "unit runner", ok: false, detail: unitRun.stderr || unitRun.stdout }];
  }

  const sb = getSupabase();
  const gt = await ensureGtAccount(sb);

  for (const account of [ACCOUNTS.step, gt, ACCOUNTS.pack3, ACCOUNTS.accelerator]) {
    console.log("Checking", account.label, "…");
    const result = await checkAccount(account);
    report.accounts.push(result);
    console.log(result.ok ? "PASS" : "FAIL", account.label, JSON.stringify(result.me), JSON.stringify(result.mocks));
  }

  report.finishedAt = new Date().toISOString();
  report.allPassed =
    report.unit.every((c) => c.ok) && report.accounts.every((a) => a.ok);

  const reportPath = path.join(outDir, "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log("\nReport:", reportPath);
  console.log("allPassed:", report.allPassed);
  if (!report.allPassed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
