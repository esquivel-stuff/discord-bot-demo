import { describe, expect, it } from 'vitest';
import { DiceError, formatDice, parseDice, rollDice } from '../src/lib/dice.js';

describe('parseDice', () => {
  it('parses common notations', () => {
    expect(parseDice('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDice('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseDice(' 4D8 - 1 ')).toEqual({ count: 4, sides: 8, modifier: -1 });
  });

  it.each(['', 'abc', '2d', 'd1', '0d6', '51d6', '1d1001', '2d6+'])('rejects %j', (input) => {
    expect(() => parseDice(input)).toThrow(DiceError);
  });
});

describe('rollDice', () => {
  it('uses the rng and sums with the modifier', () => {
    const seq = [0, 0.999, 0.5];
    const r = rollDice({ count: 3, sides: 6, modifier: 2 }, () => seq.shift()!);
    expect(r.rolls).toEqual([1, 6, 4]);
    expect(r.total).toBe(13);
  });

  it('always stays within range', () => {
    for (let i = 0; i < 500; i++) {
      const r = rollDice({ count: 1, sides: 20, modifier: 0 });
      expect(r.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(r.rolls[0]).toBeLessThanOrEqual(20);
    }
  });

  it('formats nicely', () => {
    const r = rollDice({ count: 2, sides: 6, modifier: -1 }, () => 0.5);
    expect(formatDice(r)).toBe('🎲 **2d6-1** → [4, 4] - 1 = **7**');
  });
});
