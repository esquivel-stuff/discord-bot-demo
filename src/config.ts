import 'dotenv/config';

export interface Config {
  token: string;
  clientId?: string;
  guildId?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env.DISCORD_TOKEN?.trim();
  if (!token || token === 'your-bot-token-here') {
    throw new Error('DISCORD_TOKEN is missing. Copy .env.example to .env and add your bot token.');
  }
  return {
    token,
    clientId: env.DISCORD_CLIENT_ID?.trim() || undefined,
    guildId: env.DISCORD_GUILD_ID?.trim() || undefined,
  };
}
