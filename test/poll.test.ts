import { describe, expect, it } from 'vitest';
import {
  castVote,
  createPoll,
  parsePollButtonId,
  pollButtonId,
  PollError,
  progressBar,
  renderResults,
  tally,
} from '../src/lib/poll.js';

const make = () => createPoll('abc123', 'Best snack?', ['Pizza', 'Tacos', '', 'Sushi', ''], 'author');

describe('poll', () => {
  it('drops empty options and validates', () => {
    expect(make().options).toEqual(['Pizza', 'Tacos', 'Sushi']);
    expect(() => createPoll('x', 'q', ['only one'], 'a')).toThrow(PollError);
    expect(() => createPoll('x', 'q', ['a', 'A'], 'a')).toThrow(/unique/);
    expect(() => createPoll('x', 'q', ['1', '2', '3', '4', '5', '6'], 'a')).toThrow(/at most/);
  });

  it('one vote per user, change and toggle off', () => {
    const p = make();
    castVote(p, 'u1', 0);
    castVote(p, 'u2', 0);
    castVote(p, 'u3', 2);
    expect(tally(p)).toEqual([2, 0, 1]);
    castVote(p, 'u1', 1); // change
    expect(tally(p)).toEqual([1, 1, 1]);
    expect(castVote(p, 'u1', 1)).toBeNull(); // toggle off
    expect(tally(p)).toEqual([1, 0, 1]);
    expect(() => castVote(p, 'u1', 7)).toThrow(PollError);
  });

  it('renders bars and percentages', () => {
    const p = make();
    castVote(p, 'u1', 0);
    castVote(p, 'u2', 0);
    castVote(p, 'u3', 1);
    castVote(p, 'u4', 0);
    const out = renderResults(p);
    expect(out).toContain('3 votes (75%)');
    expect(out).toContain('1 vote (25%)');
    expect(out).toContain('4 total votes');
    expect(progressBar(0.5, 10)).toBe('█████░░░░░');
    expect(progressBar(2, 4)).toBe('████');
  });

  it('round-trips button ids', () => {
    expect(parsePollButtonId(pollButtonId('abc123', 3))).toEqual({ pollId: 'abc123', index: 3 });
    expect(parsePollButtonId('other:thing')).toBeNull();
  });
});
