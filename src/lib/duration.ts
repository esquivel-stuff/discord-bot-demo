/** Parses human durations like "10m", "1h30m", "2d", "45s" into milliseconds. */

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

const PART_RE = /(\d+)\s*([smhdw])/gi;

export class DurationError extends Error {}

export function parseDuration(input: string): number {
  const cleaned = input.trim().toLowerCase();
  if (!cleaned) throw new DurationError('Please give a duration like `10m` or `1h30m`.');

  let total = 0;
  let consumed = '';
  for (const m of cleaned.matchAll(PART_RE)) {
    total += Number(m[1]) * UNIT_MS[m[2]!.toLowerCase()]!;
    consumed += m[0];
  }
  if (total === 0 || consumed.replace(/\s+/g, '') !== cleaned.replace(/\s+/g, '')) {
    throw new DurationError(`"${input}" isn't a duration I understand. Use e.g. \`30s\`, \`10m\`, \`2h\`, \`1d12h\`.`);
  }
  return total;
}

export function formatDuration(ms: number): string {
  const parts: string[] = [];
  let rest = Math.round(ms / 1000);
  for (const [label, secs] of [['d', 86_400], ['h', 3_600], ['m', 60], ['s', 1]] as const) {
    const n = Math.floor(rest / secs);
    if (n > 0) parts.push(`${n}${label}`);
    rest -= n * secs;
  }
  return parts.join(' ') || '0s';
}
