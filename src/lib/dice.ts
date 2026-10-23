/** Dice notation parsing and rolling, e.g. "d20", "2d6+3", "4d8-1". */

export interface DiceSpec {
  count: number;
  sides: number;
  modifier: number;
}

export interface DiceResult extends DiceSpec {
  rolls: number[];
  total: number;
}

export const MAX_DICE = 50;
export const MAX_SIDES = 1000;

const DICE_RE = /^(\d*)d(\d+)(?:([+-])(\d+))?$/i;

export class DiceError extends Error {}

export function parseDice(input: string): DiceSpec {
  const match = DICE_RE.exec(input.replace(/\s+/g, ''));
  if (!match) {
    throw new DiceError(`"${input}" isn't valid dice notation. Try something like \`2d6+3\`.`);
  }
  const [, countStr, sidesStr, sign, modStr] = match;
  const count = countStr ? Number(countStr) : 1;
  const sides = Number(sidesStr);
  const modifier = modStr ? Number(modStr) * (sign === '-' ? -1 : 1) : 0;

  if (count < 1 || count > MAX_DICE) throw new DiceError(`You can roll between 1 and ${MAX_DICE} dice.`);
  if (sides < 2 || sides > MAX_SIDES) throw new DiceError(`Dice must have between 2 and ${MAX_SIDES} sides.`);
  return { count, sides, modifier };
}

/** Rolls dice. `rng` returns a float in [0, 1) and is injectable for tests. */
export function rollDice(spec: DiceSpec, rng: () => number = Math.random): DiceResult {
  const rolls = Array.from({ length: spec.count }, () => Math.floor(rng() * spec.sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0) + spec.modifier;
  return { ...spec, rolls, total };
}

export function formatDice(result: DiceResult): string {
  const notation = `${result.count}d${result.sides}${
    result.modifier ? (result.modifier > 0 ? `+${result.modifier}` : `${result.modifier}`) : ''
  }`;
  const shown = result.rolls.length > 20 ? `${result.rolls.slice(0, 20).join(', ')}, …` : result.rolls.join(', ');
  const mod = result.modifier ? ` ${result.modifier > 0 ? '+' : '-'} ${Math.abs(result.modifier)}` : '';
  return `🎲 **${notation}** → [${shown}]${mod} = **${result.total}**`;
}
