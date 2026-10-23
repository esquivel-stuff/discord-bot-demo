/** Poll state + rendering. Votes are kept in memory (one vote per user, changeable). */

export const MAX_OPTIONS = 5;
export const OPTION_EMOJI = ['🇦', '🇧', '🇨', '🇩', '🇪'] as const;

export interface Poll {
  id: string;
  question: string;
  options: string[];
  authorId: string;
  votes: Map<string, number>; // userId -> option index
}

export class PollError extends Error {}

export function createPoll(id: string, question: string, rawOptions: string[], authorId: string): Poll {
  const options = rawOptions.map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) throw new PollError('A poll needs at least 2 options.');
  if (options.length > MAX_OPTIONS) throw new PollError(`A poll can have at most ${MAX_OPTIONS} options.`);
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
    throw new PollError('Poll options must be unique.');
  }
  return { id, question: question.trim(), options, authorId, votes: new Map() };
}

/** Records a vote. Voting for the same option again removes the vote. Returns the new choice or null. */
export function castVote(poll: Poll, userId: string, optionIndex: number): number | null {
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new PollError('Unknown poll option.');
  }
  if (poll.votes.get(userId) === optionIndex) {
    poll.votes.delete(userId);
    return null;
  }
  poll.votes.set(userId, optionIndex);
  return optionIndex;
}

export function tally(poll: Poll): number[] {
  const counts = poll.options.map(() => 0);
  for (const idx of poll.votes.values()) counts[idx] = (counts[idx] ?? 0) + 1;
  return counts;
}

export function progressBar(fraction: number, width = 12): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  const filled = Math.round(clamped * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function renderResults(poll: Poll): string {
  const counts = tally(poll);
  const total = counts.reduce((a, b) => a + b, 0);
  const lines = poll.options.map((opt, i) => {
    const n = counts[i] ?? 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    return `${OPTION_EMOJI[i]} **${opt}**\n\`${progressBar(total ? n / total : 0)}\` ${n} vote${n === 1 ? '' : 's'} (${pct}%)`;
  });
  lines.push(`\n${total} total vote${total === 1 ? '' : 's'}`);
  return lines.join('\n');
}

export const pollButtonId = (pollId: string, index: number) => `poll:${pollId}:${index}`;

export function parsePollButtonId(customId: string): { pollId: string; index: number } | null {
  const m = /^poll:([\w-]+):(\d)$/.exec(customId);
  return m ? { pollId: m[1]!, index: Number(m[2]) } : null;
}
