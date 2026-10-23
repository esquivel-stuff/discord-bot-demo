import { EmbedBuilder } from 'discord.js';

export const COLORS = { brand: 0x7c5cff, success: 0x3ecf8e, error: 0xf25f5c } as const;

export const errorEmbed = (message: string) =>
  new EmbedBuilder().setColor(COLORS.error).setDescription(`⚠️ ${message}`);
