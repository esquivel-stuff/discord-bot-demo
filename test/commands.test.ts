import { describe, expect, it } from 'vitest';
import { commands } from '../src/commands/index.js';

describe('command definitions', () => {
  it('produce valid JSON payloads for Discord', () => {
    const names = commands.map((c) => c.data.toJSON().name);
    expect(names).toEqual(['poll', 'remind', 'roll', 'purge']);
    for (const c of commands) {
      const json = c.data.toJSON();
      expect(json.description.length).toBeGreaterThan(0);
      expect(json.description.length).toBeLessThanOrEqual(100);
    }
  });

  it('restricts /purge to moderators', () => {
    const purge = commands.find((c) => c.data.name === 'purge')!.data.toJSON();
    expect(purge.default_member_permissions).toBe('8192'); // ManageMessages
  });
});
