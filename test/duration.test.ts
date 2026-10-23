import { describe, expect, it } from 'vitest';
import { DurationError, formatDuration, parseDuration } from '../src/lib/duration.js';

describe('parseDuration', () => {
  it('parses single and compound units', () => {
    expect(parseDuration('45s')).toBe(45_000);
    expect(parseDuration('10m')).toBe(600_000);
    expect(parseDuration('1h30m')).toBe(5_400_000);
    expect(parseDuration('1d 12h')).toBe(129_600_000);
    expect(parseDuration('2W')).toBe(1_209_600_000);
  });

  it.each(['', 'soon', '10', '10x', '5m and stuff', '0m'])('rejects %j', (input) => {
    expect(() => parseDuration(input)).toThrow(DurationError);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(5_400_000)).toBe('1h 30m');
    expect(formatDuration(90_061_000)).toBe('1d 1h 1m 1s');
    expect(formatDuration(0)).toBe('0s');
  });
});
