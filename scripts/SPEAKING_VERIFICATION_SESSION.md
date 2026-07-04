# Speaking Module Verification Test Script

**Purpose:** One real session on **production** to verify Phase 3 scoring, evidence repair, mic behavior, and Part 2/3 alignment end-to-end.

**Automated pre-check (run before manual session):**

```bash
npm run test:regression
```

That covers junk-audio rejection, Part 2→3 topic alignment, mic auto-arm policy, session-end disarm, and planted-transcript evidence repair — but **cannot** replace a live mic/TTS/STT session.

**Production URL:** https://ielts-ai-tutor-neon.vercel.app

---

## Before you start

- [ ] Use headphones, quiet room (so audio-quality bugs don't contaminate this test)
- [ ] Have this doc open on a second screen/device so you can read your lines while speaking
- [ ] Screenshot the final report + full transcript when done

---

## Part 1 — Personal questions

Sarah will ask your name, hometown, work/study, etc. Work these planted items into your natural answers wherever they fit:

| # | Say this (verbatim or close) | Planted error | Should be flagged as |
|---|------------------------------|---------------|----------------------|
| 1 | "I am living here since three years." | Wrong preposition (since → for) | Grammar |
| 2 | "I go to the office yesterday and I finish my work early." | Wrong tense (go → went) | Grammar |
| 3 | "The weather here is very unique." | Redundant intensifier (unique is absolute) | Lexical Resource |
| 4 | "I think it's a good idea, and my friend also thinks it's a good plan, so overall it's very good." | Repetition of "good" 3× in one breath | Lexical Resource |
| 5 | (anywhere) "Um... uh... I think... um... it's nice." | Deliberate filler overload | Fluency & Coherence |
| 6 | Pause silently for 4–5 full seconds mid-answer at least once | Long hesitation | Fluency & Coherence (pause metrics) |

---

## Part 2 — Cue card (long turn)

Whatever topic you're given, make sure your 1–2 minute answer includes:

| # | Say this | Planted error | Should be flagged as |
|---|----------|---------------|----------------------|
| 7 | "Last week I go to visit my friend and we is talking for hours." | Two tense/agreement errors in one sentence | Grammar |
| 8 | "It was a very delicious meal and a very unique experience." | Redundant intensifiers again (repeat of #3, different context) | Lexical Resource |
| 9 | Use the word "nice" at least 3 times to describe different things (a place, a person, a feeling) | Overused basic vocabulary | Lexical Resource |

**Mic-arming check:** Wait for **MIC LIVE** confirmation before speaking a single word. If Sarah says "please begin speaking" before you see that confirmation, stop and note it — that's the mic-arming regression resurfacing.

---

## Part 3 — Discussion

**Before saying anything** — check whether Sarah's Part 3 questions match your Part 2 cue card theme:

| Field | Your notes |
|-------|------------|
| My Part 2 topic was | _______________ |
| Sarah's first Part 3 question was about | _______________ |
| Are they related? | Y / N |

Then work in:

| # | Say this | Planted error | Should be flagged as |
|---|----------|---------------|----------------------|
| 10 | "In my country, people usually doesn't think this way." | Subject–verb agreement error | Grammar |
| 11 | "It's beneficial and beneficial for society, and it can beneficial many people." | Wrong word form + repetition | Grammar + Lexical |
| 12 | Speak in noticeably short, choppy sentences for one full answer: "It is good. People like it. It helps them. It is important." | No linking/complex sentences | Fluency & Coherence |

---

## End of session — shutdown behavior

- [ ] Let Sarah deliver her closing statement in full ("that concludes the test," "goodbye," etc.)
- [ ] Do **not** click anything — watch: does the mic visibly disarm/stop listening on its own?
- [ ] Does the app move to a results/completion screen, or stay in a "waiting" state?
- [ ] Note whether **"evidence is not defined"** or any other raw error text appears during this transition

---

## Junk-audio spot check (optional, separate short session)

For one answer only, say deadpan: **"Thanks for watching, don't forget to subscribe"** instead of a real answer. It should be **rejected**, not scored or advanced.

---

## After the session — grading checklist

Open the transcript and final report side by side. Go item by item.

### Correctness

| Item | Caught? | Evidence quote matches transcript? |
|------|---------|-----------------------------------|
| #1 (since→for) under Grammar | Y / N | |
| #2 (tense) under Grammar | Y / N | |
| #3 (very unique) under Lexical | Y / N | |
| #4 (good repeated) under Lexical | Y / N | |
| #5/6 (fillers/pauses) in Fluency score/metrics | Y / N | |
| #7 (go/is) under Grammar | Y / N | |
| #8 (delicious/unique repeat) under Lexical | Y / N | |
| #9 (nice ×3) under Lexical | Y / N | |
| #10 (doesn't) under Grammar | Y / N | |
| #11 (beneficial misuse/repeat) under Grammar or Lexical | Y / N | |
| #12 (choppy sentences) in Fluency & Coherence | Y / N | |

### Critical cross-check (original evidence-recycle bug)

- [ ] Evidence quotes for Grammar, Lexical, Fluency, and Pronunciation are **different** sentences from your actual transcript
- [ ] No single sentence reused as evidence for more than one criterion

### Part 2/3 alignment

- [ ] Part 3 discussion was related to Part 2 topic: **Y / N**

### Mic / session behavior

- [ ] **MIC LIVE** appeared before Sarah said "begin speaking" in Part 2: **Y / N**
- [ ] Mic disarmed on its own after Sarah's closing statement: **Y / N**
- [ ] No raw error text (e.g. "evidence is not defined") anywhere: **Y / N**

### Score sanity

Given 12 deliberate errors across all three parts, overall band should **not** look artificially high. A session this error-dense should not score above ~**6.0** on Grammar or Lexical Resource. If it does, the scorer isn't weighting real errors properly.

**Notes:**

---

## What to send back (Cursor / team)

1. This filled-out checklist
2. Screenshot of final report
3. Screenshot or export of full transcript

That is enough to judge whether Phase 3 scoring is trustworthy or still "right shape, wrong substance."

---

## Mapping to automated tests

| Manual check | Automated coverage |
|--------------|-------------------|
| Junk-audio (#optional) | `npm run test:speaking-pipeline` — `"Thank you for watching!"` |
| Part 2/3 topic alignment | `test:speaking-pipeline` — transition speech + prompt |
| Mic auto-arm / session end | `test:speaking-pipeline` — policy unit tests |
| Evidence not all same line | `test:speaking-scoring` — repair rejects name-line recycle |
| Planted grammar/lexical (#1–4, partial) | `test:speaking-scoring` — since/unique/yesterday in repair path |
| Live STT, TTS, mic UI, LLM band weights | **Manual session only** |
