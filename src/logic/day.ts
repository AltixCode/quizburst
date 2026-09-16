/**
 * The player's local calendar day, as a stable key.
 *
 * This lived inside `app/index.tsx` and was not exported, so the tests for the
 * daily cap could not ask what today was and hardcoded `'2026-09-15'` instead.
 * That test passed on exactly one calendar day and began failing at the next
 * midnight — the cap was never broken, the test simply expired.
 *
 * Local, not UTC, so the cap resets at the player's midnight rather than at
 * some hour of their afternoon.
 */
export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
