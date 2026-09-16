import { dayKeyOf } from '../day';

describe('dayKeyOf', () => {
  it('pads the month and the day to two digits', () => {
    expect(dayKeyOf(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKeyOf(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('uses the LOCAL calendar day, not UTC', () => {
    // 23:30 local on the 15th is already the 16th in UTC for any timezone east
    // of it. The cap has to reset at the player's midnight, not at some hour of
    // their evening, so the local date is the one that counts.
    const lateLocal = new Date(2026, 8, 15, 23, 30);
    expect(dayKeyOf(lateLocal)).toBe('2026-09-15');
  });

  it('changes at midnight and not before', () => {
    expect(dayKeyOf(new Date(2026, 8, 15, 23, 59, 59))).toBe('2026-09-15');
    expect(dayKeyOf(new Date(2026, 8, 16, 0, 0, 0))).toBe('2026-09-16');
  });

  it('is stable for the same day whatever the time', () => {
    const morning = dayKeyOf(new Date(2026, 8, 16, 6, 0));
    const evening = dayKeyOf(new Date(2026, 8, 16, 21, 0));
    expect(morning).toBe(evening);
  });
});
