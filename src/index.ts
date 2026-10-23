import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { commandMap } from './commands/index.js';
import { loadConfig } from './config.js';
import { ReminderScheduler } from './lib/reminders.js';
import { errorEmbed } from './ui.js';
import type { BotContext } from './types.js';

let config: ReturnType<typeof loadConfig>;
try {
  config = loadConfig();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exit(1);
}
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const ctx: BotContext = {
  polls: new Map(),
  reminders: new ReminderScheduler(async (r) => {
    const channel = await client.channels.fetch(r.channelId).catch(() => null);
    const text = `⏰ <@${r.userId}>, reminder: ${r.message}`;
    if (channel?.isSendable()) {
      await channel.send({ content: text, allowedMentions: { users: [r.userId] } });
    } else {
      const user = await client.users.fetch(r.userId).catch(() => null);
      await user?.send(text).catch(() => undefined);
    }
  }),
};

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag} — serving ${c.guilds.cache.size} server(s)`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandMap.get(interaction.commandName);
      if (command) await command.execute(interaction, ctx);
    } else if (interaction.isButton()) {
      const [prefix] = interaction.customId.split(':');
      const command = prefix ? commandMap.get(prefix) : undefined;
      if (command?.handleButton) await command.handleButton(interaction, ctx);
    }
  } catch (err) {
    console.error('Interaction failed:', err);
    if (interaction.isRepliable()) {
      const payload = { embeds: [errorEmbed('Something went wrong running that command.')], flags: MessageFlags.Ephemeral } as const;
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => undefined);
      else await interaction.reply(payload).catch(() => undefined);
    }
  }
});

console.log(`Loaded ${commandMap.size} commands: ${[...commandMap.keys()].map((n) => `/${n}`).join(', ')}`);
console.log('Logging in to Discord…');
client.login(config.token).catch((err: Error) => {
  console.error(`❌ Login failed: ${err.message}`);
  process.exit(1);
});
