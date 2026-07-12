/** Shared listening transcript rules for IELTS exam + accelerator agents. */

const LISTENING_TRANSCRIPT_SPELLING_RULES = `
LISTENING TRANSCRIPT RULES — MANDATORY:
For any name, surname, address, email, street name, or unusual word
that appears as an answer in form completion questions:
The speaker MUST spell it out letter by letter in the transcript.

Example for name "Alfarsi":
Receptionist: Could I have your surname please?
Caller: It's Alfarsi.
Receptionist: Could you spell that for me?
Caller: Sure — A-L-F-A-R-S-I.
Receptionist: Thank you, Mr Alfarsi.

Example for email "james.hill@outlook.com":
Agent: And your email address?
Caller: It's james dot hill at outlook dot com.
Agent: Let me read that back — j-a-m-e-s dot h-i-l-l at outlook dot com?
Caller: That's correct.

Example for address "14 Kensington Road":
Agent: What is your address?
Caller: 14 Kensington Road. Kensington — K-E-N-S-I-N-G-T-O-N.

This is mandatory for ALL form completion answers that could be
ambiguous, misspelled, or unfamiliar to the listener.
Never hide an answer — always make it hearable AND spellable.`;

const LISTENING_TRANSCRIPT_SELF_CORRECTION_RULES = `
SELF-CORRECTION / DISTRACTOR RULES — MANDATORY for Sections 1 and 3:
Real IELTS audio often states a wrong detail first, then corrects it.
Students must catch the FINAL correct value.

Required pattern (at least once per Section 1 dialogue and once per Section 3 discussion):
1) Speaker states an incorrect fee/date/time/number/place.
2) Same speaker (or another) corrects it clearly:
   "sorry, actually…" / "I mean…" / "no — wait…" / "actually it's…"

Example (fee):
Coordinator: The fee is ninety-five pounds.
Caller: Ninety-five?
Coordinator: Sorry — actually eighty-five for evening enrolments. I had the daytime rate open.

Example (quantity):
Oliver: We were going to do two hundred questionnaires…
Oliver: Well, actually, we've decided on one hundred and fifty.

Do NOT leave the first (wrong) figure as the only figure stated.
The correct answer in the answer key MUST match the corrected value.`;

const LISTENING_TRANSCRIPT_AUTHENTICITY_RULES = `
${LISTENING_TRANSCRIPT_SPELLING_RULES}

${LISTENING_TRANSCRIPT_SELF_CORRECTION_RULES}

NATURAL SPEECH (light touch):
- Use contractions (I'd, that's, we've).
- Occasional hesitations: er, um, well — especially Sections 1 and 3.
- Do not make speech unnaturally slow or chaotic.
- MCQ: exactly 3 options (A, B, C). Matching answers: letters from a box.`;

module.exports = {
  LISTENING_TRANSCRIPT_SPELLING_RULES,
  LISTENING_TRANSCRIPT_SELF_CORRECTION_RULES,
  LISTENING_TRANSCRIPT_AUTHENTICITY_RULES,
};
