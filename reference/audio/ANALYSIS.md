# Reference audio — analysis notes

## Files present

| File | Size |
|------|------|
| `WhatsApp Audio 2026-07-13 at 1.20.13 PM.mpeg` | ~9.8 MB |
| `WhatsApp Audio 2026-07-13 at 1.20.13 PM (1).mpeg` | ~11.4 MB |
| `WhatsApp Audio 2026-07-13 at 1.20.13 PM (2).mpeg` | ~11.0 MB |
| `WhatsApp Audio 2026-07-13 at 1.20.13 PM (3).mpeg` | ~10.2 MB |

These are treated as **structural references only**. The generator must never copy or closely imitate their spoken content.

## What Cursor cannot do without a transcript

Cursor cannot hear or auto-transcribe these files in this environment (`ffprobe` is also unavailable here). Without text transcripts we **cannot** reliably measure:

- Exact speaker turns / gender switches
- When each answer is spoken
- Distractor wording
- Hesitation / self-correction phrasing
- Synonym paraphrases vs question stems
- Exact pause lengths and answer-to-answer timing

## Structural targets encoded into the product

Based on **official IELTS Listening paper design** (not the private wording of these clips), the generator + validators enforce:

| Area | Product rule |
|------|----------------|
| Dialogue | Fillers (`er`/`um`/`well`), contractions, S1 letter-spelling of surnames |
| Distractors | Self-correction / wrong-value-first then fix (S1/S3+) |
| Answer spacing | Min gap between consecutive spoken gap-fill answers |
| Pacing | Word-count floors ≈ 150 wpm (~2.5–5 min speech per section) |
| Mid-section look | `[SECTION BREAK]` between question blocks (S1–S3) |
| Lecture pacing | `[pause]` / `[long pause]` in Section 4 |
| Sync | Every gap-fill answer spoken in transcript; S1 example spoken |
| Publish gate | Integrity fail → regenerate (up to 3 attempts), never serve broken |

## How to unlock deeper analysis

Place plain-text transcripts here:

`reference/transcripts/section-1.txt` … `section-4.txt`

(or one file per WhatsApp clip). Then ask Cursor to re-analyse **structure only** (timing patterns, feature counts) — still without copying content into generated tests.
