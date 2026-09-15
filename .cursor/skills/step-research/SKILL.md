---
name: step-research
description: >-
  Research Saudi STEP (Standardized Test of English Proficiency) from Qiyas/ETEC
  sources and generate STEP-aligned practice content. Use when the user mentions
  STEP, Qiyas, كفايات اللغة الإنجليزية, Saudi university English test, step-test,
  or wants STEP mock questions, exam format, or LMS content for STEP preparation.
---

# STEP Research & Content Agent

## Quick reference

| Field | Value | Confidence |
|-------|-------|------------|
| Full name | Standardized Test of English Proficiency | High |
| Administrator | Qiyas / ETEC | High |
| Framework | CEFR-based (ETEC). Speakify scores are **not** official CEFR certificates. | High |
| Format | 100 scored MCQs (A–D) + unscored trial items | High |
| Seat time | Three hours including instructions | High |
| Components | Reading 40% · Structure 30% · Listening 20% · Compositional Analysis 10% | High |
| Scored counts | 40 / 30 / 20 / 10 if 1 point per item | Inferred |
| Section order / clocks | Speakify study sequence 60/45/30/15 — **not** confirmed test-day | Study |
| Speaking / essay | **Not included** | High |
| Not EPT | EPT is a different Qiyas test (no listening, typically 80/90 min) | High |

Official pages (government, not commercial prep):
- ETEC language tests: https://etec.gov.sa/en/productsandservices/Qiyas/lingual
- Candidate e-services: https://e-services.etec.gov.sa/Qiyas.TRAS.Web.Internet/
- Do not treat https://qiyas.sa (prep-site branding) as the official portal.

Canonical facts live in `lib/step/officialBlueprint.ts` and `lib/step/examModel.ts`.
Public JSON: `GET /api/step/exam-model`.

Public registration stays **closed** until a 2025/2026 candidate notice confirms order and scoring scale.

## When to use this skill

1. User asks about STEP format, scoring, or preparation
2. Building STEP LMS pages, mocks, or question banks
3. Comparing STEP vs IELTS/TOEFL/EPT for Saudi learners
4. Running or extending STEP research/content agents

## Codebase locations

| Asset | Path |
|-------|------|
| Sourced blueprint | `lib/step/officialBlueprint.ts` |
| Exam model | `lib/step/examModel.ts` |
| Student exam brief | `app/dashboard/step/student/exam-brief/page.tsx` |
| Question types | `lib/step/types.ts` |
| AI prompts | `lib/step/prompts.ts` |
| Research agent | `agent/stepResearchAgent.js` |
| Question generator | `agent/stepQuestionAgent.js` |
| Registration slug | `step-test` (closed) |
| Course catalog | `step-preparation` |

## Content generation rules

- **Reading**: Numbered paragraphs; questions follow paragraph order; bold words → vocabulary; title/main-idea last per passage
- **Structure**: One grammar focus; tenses and prepositions highest frequency
- **Listening**: Dialogue + **spoken question** in the transcript; one play; UI hides written stem during audio
- **Compositional Analysis**: Punctuation, word order, sentence combining, find-incorrect-underlined

Do NOT generate IELTS speaking/essays, EPT papers, or fake university cutoff scores as universal STEP fact.

## Extending the model

When a current official notice arrives: update `officialBlueprint.ts` confidence, then `examModel.ts`, mock/mini/exit constants, prompts, `programJourneys.ts`. Reopen registration only if policy in `officialBlueprint.ts` is satisfied.
