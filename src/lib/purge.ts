/** Validation for the /purge moderation command. */

export const PURGE_MIN = 1;
export const PURGE_MAX = 100; // Discord bulk-delete limit
export const BULK_DELETE_MAX_AGE_MS = 14 * 86_400_000; // Discord can't bulk-delete older messages

export function validatePurgeAmount(amount: number): string | null {
  if (!Number.isInteger(amount)) return 'Amount must be a whole number.';
  if (amount < PURGE_MIN || amount > PURGE_MAX) return `Amount must be between ${PURGE_MIN} and ${PURGE_MAX}.`;
  return null;
}

/** Filters messages to ones Discord allows bulk-deleting, optionally only from one user. */
export function selectDeletable<T extends { createdTimestamp: number; authorId: string; pinned: boolean }>(
  messages: T[],
  now: number,
  options: { userId?: string; amount: number },
): T[] {
  return messages
    .filter((m) => !m.pinned)
    .filter((m) => now - m.createdTimestamp < BULK_DELETE_MAX_AGE_MS)
    .filter((m) => !options.userId || m.authorId === options.userId)
    .slice(0, options.amount);
}
