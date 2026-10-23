import { describe, expect, it } from 'vitest';
import { BULK_DELETE_MAX_AGE_MS, selectDeletable, validatePurgeAmount } from '../src/lib/purge.js';

describe('purge', () => {
  it('validates amount', () => {
    expect(validatePurgeAmount(10)).toBeNull();
    expect(validatePurgeAmount(0)).toMatch(/between/);
    expect(validatePurgeAmount(101)).toMatch(/between/);
    expect(validatePurgeAmount(2.5)).toMatch(/whole/);
  });

  it('skips pinned and too-old messages and filters by user', () => {
    const now = 100 * 86_400_000;
    const msgs = [
      { id: '1', createdTimestamp: now - 1000, authorId: 'a', pinned: false },
      { id: '2', createdTimestamp: now - 2000, authorId: 'b', pinned: false },
      { id: '3', createdTimestamp: now - 3000, authorId: 'a', pinned: true },
      { id: '4', createdTimestamp: now - BULK_DELETE_MAX_AGE_MS - 1, authorId: 'a', pinned: false },
      { id: '5', createdTimestamp: now - 5000, authorId: 'a', pinned: false },
    ];
    expect(selectDeletable(msgs, now, { amount: 10 }).map((m) => m.id)).toEqual(['1', '2', '5']);
    expect(selectDeletable(msgs, now, { amount: 10, userId: 'a' }).map((m) => m.id)).toEqual(['1', '5']);
    expect(selectDeletable(msgs, now, { amount: 1 }).map((m) => m.id)).toEqual(['1']);
  });
});
