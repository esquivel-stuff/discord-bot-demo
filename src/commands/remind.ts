import { EmbedBuilder, MessageFlags, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { DurationError, parseDuration } from '../lib/duration.js';
import { ReminderError } from '../lib/reminders.js';
import { COLORS, errorEmbed } from '../ui.js';
import type { Command } from '../types.js';

export const remind: Command = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set, list or cancel reminders')
    .addSubcommand((s) =>
      s
        .setName('me')
        .setDescription('Remind me about something later')
        .addStringOption((o) => o.setName('in').setDescription('When, e.g. 10m, 2h, 1d12h').setRequired(true))
        .addStringOption((o) =>
          o.setName('about').setDescription('What to remind you about').setRequired(true).setMaxLength(500),
        ),
    )
    .addSubcommand((s) => s.setName('list').setDescription('Show your active reminders'))
    .addSubcommand((s) =>
      s
        .setName('cancel')
        .setDescription('Cancel a reminder')
        .addIntegerOption((o) => o.setName('id').setDescription('Reminder ID from /remind list').setRequired(true)),
    ),

  async execute(interaction, { reminders }) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'list') {
      const list = reminders.listFor(userId);
      const description = list.length
        ? list
            .map((r) => `\`#${r.id}\` ${time(Math.floor(r.dueAt / 1000), TimestampStyles.RelativeTime)} — ${r.message}`)
            .join('\n')
        : 'You have no active reminders.';
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.brand).setTitle('⏰ Your reminders').setDescription(description)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'cancel') {
      const id = interaction.options.getInteger('id', true);
      const ok = reminders.cancel(userId, id);
      await interaction.reply({
        embeds: [ok ? new EmbedBuilder().setColor(COLORS.success).setDescription(`🗑️ Reminder #${id} cancelled.`) : errorEmbed(`No active reminder #${id}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const delay = parseDuration(interaction.options.getString('in', true));
      const about = interaction.options.getString('about', true);
      const r = reminders.schedule(userId, interaction.channelId, about, delay);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setDescription(
              `⏰ Got it! I'll remind you ${time(Math.floor(r.dueAt / 1000), TimestampStyles.RelativeTime)}:\n> ${r.message}`,
            )
            .setFooter({ text: `Reminder #${r.id}` }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      if (!(err instanceof DurationError || err instanceof ReminderError)) throw err;
      await interaction.reply({ embeds: [errorEmbed(err.message)], flags: MessageFlags.Ephemeral });
    }
  },
};
