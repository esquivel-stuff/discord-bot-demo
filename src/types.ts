import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { Poll } from './lib/poll.js';
import type { ReminderScheduler } from './lib/reminders.js';

export interface BotContext {
  polls: Map<string, Poll>;
  reminders: ReminderScheduler;
}

export interface Command {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
  handleButton?(interaction: ButtonInteraction, ctx: BotContext): Promise<void>;
}
