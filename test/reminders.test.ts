import { describe, expect, it, vi } from 'vitest';
import { MAX_PER_USER, ReminderError, ReminderScheduler, type Timers } from '../src/lib/reminders.js';

function fakeTimers() {
  let now = 1_000_000;
  const pending = new Map<number, { at: number; fn: () => void }>();
  let next = 1;
  const timers: Timers = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = next++;
      pending.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (h) => void pending.delete(h as number),
  };
  const advance = (ms: number) => {
    now += ms;
    for (const [id, t] of [...pending]) if (t.at <= now) { pending.delete(id); t.fn(); }
  };
  return { timers, advance, pending };
}

describe('ReminderScheduler', () => {
  it('fires a reminder after the delay', () => {
    const { timers, advance } = fakeTimers();
    const onFire = vi.fn();
    const s = new ReminderScheduler(onFire, timers);
    const r = s.schedule('u1', 'c1', 'drink water', 60_000);
    advance(59_999);
    expect(onFire).not.toHaveBeenCalled();
    advance(1);
    expect(onFire).toHaveBeenCalledWith(r);
    expect(s.listFor('u1')).toEqual([]);
  });

  it('enforces delay bounds and per-user limits', () => {
    const { timers } = fakeTimers();
    const s = new ReminderScheduler(() => {}, timers);
    expect(() => s.schedule('u', 'c', 'x', 1_000)).toThrow(ReminderError);
    expect(() => s.schedule('u', 'c', 'x', 8 * 86_400_000)).toThrow(ReminderError);
    for (let i = 0; i < MAX_PER_USER; i++) s.schedule('u', 'c', `r${i}`, 60_000 + i);
    expect(() => s.schedule('u', 'c', 'one too many', 60_000)).toThrow(/already have/);
    expect(() => s.schedule('other', 'c', 'fine', 60_000)).not.toThrow();
  });

  it('lists sorted by due time and only cancels your own reminders', () => {
    const { timers, pending } = fakeTimers();
    const s = new ReminderScheduler(() => {}, timers);
    const late = s.schedule('u', 'c', 'late', 120_000);
    const early = s.schedule('u', 'c', 'early', 30_000);
    expect(s.listFor('u').map((r) => r.message)).toEqual(['early', 'late']);
    expect(s.cancel('someone-else', early.id)).toBe(false);
    expect(s.cancel('u', early.id)).toBe(true);
    expect(s.listFor('u')).toEqual([late]);
    expect(pending.size).toBe(1);
  });
});
