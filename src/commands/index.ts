import { poll } from './poll.js';
import { purge } from './purge.js';
import { remind } from './remind.js';
import { roll } from './roll.js';
import type { Command } from '../types.js';

export const commands: Command[] = [poll, remind, roll, purge];
export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
