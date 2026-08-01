# Programme routing audit — findings & fixes

Standing regression: `node scripts/routing-regression.mjs`  
(or `npm run test:routing` after package.json wiring)

## Critical fixes shipped

| Finding | Was | Fix |
|---------|-----|-----|
| `normalizeEnrolledPrograms` invented enrollment from `program_type` | Empty `enrolled_programs` + DB default `ielts` → treated as IELTS-enrolled | **Fail-closed** — empty stays empty |
| `resolveStudentProgramType` fell back to `program_type` | Same silent IELTS | **Fail-closed** — returns `null` → programme picker |
| `/api/auth/me` dropped enrollment fields | STEP with leftover `program_type=ielts` got IELTS dashboardPath | Pass full session into `dashboardPathForStudentUser` |
| Programme picker hardcoded Pathway + IELTS | Multi-programme / STEP / GT saw wrong cards | Cards from `enrolled_programs` only |
| Pathway layout ungated | Any student could open Pathway LMS | `canAccessStudentDashboard("pathway")` |
| Gateway `default: ["ielts"]` | Unknown programme → IELTS | Throw / exhaustive |
| TOEFL → IELTS Academic dashboard | Silent product swap | Programme picker |
| `mock_only` middleware hijacked all dashboards | STEP+mock purchases forced to Academic mock lobby | Only when enrollment is ielts-only / empty |
| `isIeltsAcademicEnrolled` used `program_selected` alone | Stale selected unlocked entitlement | Require `enrolled_programs` includes `ielts` |

## How to re-run (standing check)

```bash
# Against production (default)
node scripts/routing-regression.mjs

# Against another base URL
PROOF_BASE_URL=https://ielts-ai-tutor-neon.vercel.app node scripts/routing-regression.mjs
```

Evidence lands in `scripts/output/routing-regression/report.json`.

Accounts exercised: STEP-only, GT-only, mock-only pack3, paid Accelerator.
