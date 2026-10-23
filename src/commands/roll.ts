import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { DiceError, formatDice, parseDice, rollDice } from '../lib/dice.js';
import { errorEmbed } from '../ui.js';
import type { Command } from '../types.js';

export const roll: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice using standard notation, e.g. 2d6+3')
    .addStringOption((o) =>
      o.setName('dice').setDescription('Dice notation (default: 1d20)').setMaxLength(20),
    ),

  async execute(interaction) {
    const input = interaction.options.getString('dice') ?? '1d20';
    try {
      const result = rollDice(parseDice(input));
      await interaction.reply(formatDice(result));
    } catch (err) {
      if (!(err instanceof DiceError)) throw err;
      await interaction.reply({ embeds: [errorEmbed(err.message)], flags: MessageFlags.Ephemeral });
    }
  },
};
