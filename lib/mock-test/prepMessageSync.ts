/** Keep written "N seconds" in sync with the on-screen countdown. */
export function syncPrepMessageSeconds(message: string, secondsLeft: number): string {
  const n = Math.max(0, Math.floor(secondsLeft));
  const unit = n === 1 ? "second" : "seconds";
  return message.replace(/\b\d+\s+seconds?\b/gi, `${n} ${unit}`);
}
