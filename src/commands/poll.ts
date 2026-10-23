import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { randomUUID } from 'node:crypto';
import {
  castVote,
  createPoll,
  MAX_OPTIONS,
  OPTION_EMOJI,
  parsePollButtonId,
  pollButtonId,
  PollError,
  renderResults,
  type Poll,
} from '../lib/poll.js';
import { COLORS, errorEmbed } from '../ui.js';
import type { Command } from '../types.js';

const builder = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a button poll with up to 5 options')
  .addStringOption((o) => o.setName('question').setDescription('What are you asking?').setRequired(true).setMaxLength(200));
for (let i = 1; i <= MAX_OPTIONS; i++) {
  builder.addStringOption((o) =>
    o.setName(`option${i}`).setDescription(`Option ${i}`).setRequired(i <= 2).setMaxLength(80),
  );
}

function pollEmbed(poll: Poll, authorName: string) {
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`📊 ${poll.question}`)
    .setDescription(renderResults(poll))
    .setFooter({ text: `Poll by ${authorName} • click a button to vote, click again to remove` });
}

function pollButtons(poll: Poll) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    poll.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(pollButtonId(poll.id, i))
        .setEmoji(OPTION_EMOJI[i]!)
        .setLabel(opt.slice(0, 80))
        .setStyle(ButtonStyle.Secondary),
    ),
  );
}

export const poll: Command = {
  data: builder,

  async execute(interaction, { polls }) {
    const options = Array.from({ length: MAX_OPTIONS }, (_, i) => interaction.options.getString(`option${i + 1}`) ?? '');
    try {
      const p = createPoll(randomUUID().slice(0, 8), interaction.options.getString('question', true), options, interaction.user.id);
      polls.set(p.id, p);
      await interaction.reply({ embeds: [pollEmbed(p, interaction.user.displayName)], components: [pollButtons(p)] });
    } catch (err) {
      if (!(err instanceof PollError)) throw err;
      await interaction.reply({ embeds: [errorEmbed(err.message)], flags: MessageFlags.Ephemeral });
    }
  },

  async handleButton(interaction, { polls }) {
    const parsed = parsePollButtonId(interaction.customId);
    const p = parsed && polls.get(parsed.pollId);
    if (!parsed || !p) {
      await interaction.reply({ embeds: [errorEmbed('This poll has expired (the bot was restarted).')], flags: MessageFlags.Ephemeral });
      return;
    }
    castVote(p, interaction.user.id, parsed.index);
    const author = await interaction.client.users.fetch(p.authorId).catch(() => null);
    await interaction.update({ embeds: [pollEmbed(p, author?.displayName ?? 'unknown')], components: [pollButtons(p)] });
  },
};
