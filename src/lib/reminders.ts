/** In-memory reminder scheduler. Timers are injectable so the logic is testable. */

export const MAX_REMINDER_MS = 7 * 86_400_000; // 7 days
export const MIN_REMINDER_MS = 10_000; // 10 seconds
export const MAX_PER_USER = 5;

export interface Reminder {
  id: number;
  userId: string;
  channelId: string;
  message: string;
  dueAt: number;
}

export interface Timers {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const realTimers: Timers = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as NodeJS.Timeout),
};

export class ReminderError extends Error {}

export class ReminderScheduler {
  private nextId = 1;
  private readonly active = new Map<number, { reminder: Reminder; handle: unknown }>();

  constructor(
    private readonly onFire: (reminder: Reminder) => void | Promise<void>,
    private readonly timers: Timers = realTimers,
  ) {}

  schedule(userId: string, channelId: string, message: string, delayMs: number): Reminder {
    if (delayMs < MIN_REMINDER_MS) throw new ReminderError('Reminders must be at least 10 seconds away.');
    if (delayMs > MAX_REMINDER_MS) throw new ReminderError('Reminders can be at most 7 days away.');
    if (this.listFor(userId).length >= MAX_PER_USER) {
      throw new ReminderError(`You already have ${MAX_PER_USER} active reminders.`);
    }

    const reminder: Reminder = {
      id: this.nextId++,
      userId,
      channelId,
      message: message.slice(0, 500),
      dueAt: this.timers.now() + delayMs,
    };
    const handle = this.timers.setTimeout(() => {
      this.active.delete(reminder.id);
      void this.onFire(reminder);
    }, delayMs);
    this.active.set(reminder.id, { reminder, handle });
    return reminder;
  }

  cancel(userId: string, id: number): boolean {
    const entry = this.active.get(id);
    if (!entry || entry.reminder.userId !== userId) return false;
    this.timers.clearTimeout(entry.handle);
    this.active.delete(id);
    return true;
  }

  listFor(userId: string): Reminder[] {
    return [...this.active.values()]
      .map((e) => e.reminder)
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.dueAt - b.dueAt);
  }
}
