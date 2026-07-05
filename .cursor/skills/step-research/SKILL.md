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

| Field | Value |
|-------|-------|
| Full name | Standardized Test of English Proficiency |
| Administrator | Qiyas (ETEC) — [qiyas.sa](https://qiyas.sa) |
| Format | 100 MCQs (A–D), computer-based, ~150 min |
| Score | 0–100 (no pass/fail), valid 3 years |
| Speaking / Writing | **Not included** |

### Section weights

| Section | % | Questions | ~Time |
|---------|---|-----------|-------|
| Reading Comprehension | 40% | 40 | 60 min |
| Structure (Grammar) | 30% | 30 | 45 min |
| Listening | 20% | 20 | 30 min |
| Compositional Analysis | 10% | 10 | 15 min |

Official pages:
- Overview: https://qiyas.sa/%d8%b3%d8%aa%d9%8a%d8%a8
- Trial test info: https://qiyas.sa/%D8%AA%D8%AC%D8%B1%D9%8A%D8%A8%D9%8A

## When to use this skill

1. User asks about STEP format, scoring, or preparation
2. Building STEP LMS pages, mocks, or question banks
3. Comparing STEP vs IELTS/TOEFL for Saudi learners
4. Running or extending STEP research/content agents

## Codebase locations

| Asset | Path |
|-------|------|
| Exam model (canonical) | `lib/step/examModel.ts` |
| Question types | `lib/step/types.ts` |
| AI prompts | `lib/step/prompts.ts` |
| Research agent (scrape + embed) | `agent/stepResearchAgent.js` |
| Question generator | `agent/stepQuestionAgent.js` |
| Database setup | `supabase/step_content_setup.sql` |
| Registration slug | `step-test` in `lib/registration.ts` |
| Course catalog | `step-preparation` in `lib/courses/catalog.ts` |

## Research workflow

1. **Read the model first** — `lib/step/examModel.ts` has section specs, strategies, and URLs
2. **Scrape official sources** — run research agent:
   ```bash
   npm run agent:step-research
   ```
   Requires `step_knowledge` table (run `supabase/step_content_setup.sql` first)
3. **Generate practice content** — run question agent:
   ```bash
   npm run agent:step-questions
   npm run agent:step-questions -- --section=reading
   ```
4. **Verify** — check `step_knowledge` and `step_practice_bank` in Supabase

## Content generation rules

Always follow official STEP constraints from `lib/step/examModel.ts`:

- **Reading**: Numbered paragraphs (not line numbers); questions follow paragraph order; bold words → vocabulary questions; title/main-idea questions last per passage
- **Structure**: Single grammar focus per item; ~40s per question; tenses and prepositions are highest frequency
- **Listening**: Dialogue heard once; transcript for practice only; test numbers, dates, idioms
- **Compositional Analysis**: Punctuation, word order, sentence combining, find-incorrect-underlined

Do NOT generate IELTS band descriptors, speaking prompts, or essay tasks for STEP.

## STEP vs IELTS (for Saudi learners)

| | STEP | IELTS |
|---|------|-------|
| Items | 100 MCQ | Mixed formats |
| Productive skills | None | Speaking + Writing |
| Score | 0–100 | Bands 0–9 |
| Local recognition | Primary for Saudi universities | International |
| Admin | Qiyas / ETEC | British Council / IDP |

## Extending the model

When new Qiyas information is found:

1. Update `STEP_EXAM_MODEL` / `STEP_SECTIONS` in `lib/step/examModel.ts`
2. Add URL to `STEP_URLS` in `agent/stepResearchAgent.js`
3. Re-run `npm run agent:step-research`
4. Adjust `agent/stepQuestionAgent.js` prompts if question types changed

## Additional reference

For detailed official question-type examples (reading skills, structure grammar points, listening dialogues, compositional analysis), see the NCA student guide sections in the research agent output or ask the agent to read `lib/step/examModel.ts` section `questionTypes` arrays.
