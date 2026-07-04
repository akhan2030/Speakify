/**
 * Pure mic arm/disarm policy for the speaking session.
 * Kept free of React so pipeline regressions can be unit-tested.
 */

export function isSpeakingTestClosing(text: string): boolean {
  return /that is the end of the speaking test|end of the speaking test|have a (nice|good) day|goodbye/i.test(
    String(text || "")
  );
}

/**
 * Whether the turn-taking controller should auto-arm the mic after Sarah finishes speaking.
 * Part 2 uses a separate MediaRecorder path — never auto-arm during Part 2 speaking.
 */
export function shouldAutoArmTurn(input: {
  sessionStatus: string;
  processing?: boolean;
  testEnded?: boolean;
  currentPart: number;
  part2Phase: string;
}): boolean {
  if (input.sessionStatus !== "active") return false;
  if (input.processing || input.testEnded) return false;
  if (input.currentPart === 2 && input.part2Phase !== "done") return false;
  return true;
}
