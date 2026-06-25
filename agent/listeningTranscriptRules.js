/** Shared listening transcript rules for accelerator agents (Foundation / Plus / Elite). */
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

module.exports = { LISTENING_TRANSCRIPT_SPELLING_RULES };
