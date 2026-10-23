import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { PURGE_MAX, PURGE_MIN, selectDeletable, validatePurgeAmount } from '../lib/purge.js';
import { COLORS, errorEmbed } from '../ui.js';
import type { Command } from '../types.js';

export const purge: Command = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk-delete recent messages in this channel (moderators only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(0) // guild only
    .addIntegerOption((o) =>
      o.setName('amount').setDescription('How many messages').setRequired(true).setMinValue(PURGE_MIN).setMaxValue(PURGE_MAX),
    )
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user')),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');
    const problem = validatePurgeAmount(amount);
    const channel = interaction.channel;

    if (problem || !channel || !('bulkDelete' in channel)) {
      await interaction.reply({ embeds: [errorEmbed(problem ?? 'I can only purge in server text channels.')], flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const fetched = await channel.messages.fetch({ limit: 100 });
    const targets = selectDeletable(
      [...fetched.values()].map((m) => ({ id: m.id, createdTimestamp: m.createdTimestamp, authorId: m.author.id, pinned: m.pinned })),
      Date.now(),
      { amount, userId: user?.id },
    );
    const deleted = await channel.bulkDelete(targets.map((t) => t.id), true);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setDescription(`🧹 Deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}${user ? ` from ${user}` : ''}.`)
          .setFooter({ text: 'Pinned messages and messages older than 14 days are skipped.' }),
      ],
    });
  },
};
