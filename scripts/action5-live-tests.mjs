/**
 * Action 5 live URL smoke tests.
 * Run: node scripts/action5-live-tests.mjs
 */
const PROD = "https://ielts-ai-tutor-neon.vercel.app";

const results = [];

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`Testing ${PROD}\n`);

  // Test 1 — Forgot password (link is client-rendered; verify route + login shell)
  const loginRes = await fetch(`${PROD}/login`);
  const loginHtml = await loginRes.text();
  const forgotRes = await fetch(`${PROD}/forgot-password`);
  const forgotHtml = await forgotRes.text();
  if (loginRes.ok && forgotRes.ok) {
    pass(
      "Test 1 — Forgot password flow reachable",
      /forgot-password|Forgot password|reset your password/i.test(forgotHtml)
        ? "/forgot-password content OK"
        : "login + /forgot-password return 200 (link renders client-side)"
    );
  } else {
    fail("Test 1 — Forgot password flow", `login ${loginRes.status}, forgot ${forgotRes.status}`);
  }

  // Test 2 — GT writing route (public shell loads)
  const gtWritingRes = await fetch(`${PROD}/dashboard/ielts-general/student/writing`);
  if (gtWritingRes.status === 200 || gtWritingRes.status === 307 || gtWritingRes.status === 302) {
    pass("Test 2 — GT writing route responds", `status ${gtWritingRes.status}`);
  } else {
    fail("Test 2 — GT writing route responds", `status ${gtWritingRes.status}`);
  }

  // Test 3 — Academic writing route
  const acWritingRes = await fetch(`${PROD}/dashboard/student/writing`);
  if (acWritingRes.status === 200 || acWritingRes.status === 307 || acWritingRes.status === 302) {
    pass("Test 3 — Academic writing route responds", `status ${acWritingRes.status}`);
  } else {
    fail("Test 3 — Academic writing route responds", `status ${acWritingRes.status}`);
  }

  // Test 4 — Auth security: unauthenticated mock results API
  const mockRes = await fetch(`${PROD}/api/mock-test/content/fake-attempt-id-12345`);
  if (mockRes.status === 401 || mockRes.status === 403) {
    pass("Test 4 — Mock content API blocks anonymous access", `status ${mockRes.status}`);
  } else {
    fail("Test 4 — Mock content API blocks anonymous access", `status ${mockRes.status}`);
  }

  // Test 5 — Mobile login page (viewport meta + responsive shell)
  if (/viewport/i.test(loginHtml) && loginHtml.length > 500) {
    pass("Test 5 — Login page has mobile viewport meta");
  } else {
    fail("Test 5 — Login page mobile-ready markup");
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed.`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
