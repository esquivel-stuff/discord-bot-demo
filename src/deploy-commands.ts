/** Registers the slash commands with Discord. Run once after changing command definitions. */
import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { loadConfig } from './config.js';

const { token, clientId, guildId } = loadConfig();
if (!clientId) throw new Error('DISCORD_CLIENT_ID is required to deploy commands.');

const rest = new REST().setToken(token);
const body = commands.map((c) => c.data.toJSON());
const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);

await rest.put(route, { body });
console.log(`Deployed ${body.length} commands ${guildId ? `to guild ${guildId}` : 'globally (may take up to an hour)'}.`);
