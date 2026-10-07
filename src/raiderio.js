import { request } from './http.js';
import { section } from './text.js';

const API = 'https://raider.io/api/v1';
const PROFILE_FIELDS = 'gear,guild,raid_progression,mythic_plus_scores_by_season:current,mythic_plus_best_runs';

export const REGIONS = ['us', 'eu', 'kr', 'tw', 'cn'];

export async function getCharacter(region, realm, name) {
  const params = new URLSearchParams({ region, realm, name, fields: PROFILE_FIELDS });
  const character = await (await request(`${API}/characters/profile?${params}`)).json();
  const season = character.mythic_plus_scores_by_season?.[0];
  const facts = [
    `- Item level ${Number(character.gear?.item_level_equipped ?? 0).toFixed(1)}`,
    `- Mythic+ score ${season?.scores?.all ?? 0} in ${season?.season ?? 'the current season'}`,
    character.guild && `- Guild ${character.guild.name} on ${character.guild.realm}`,
    `- Raider.IO data from ${character.last_crawled_at?.slice(0, 10)}`,
  ];
  const raids = Object.entries(character.raid_progression ?? {})
    .filter(([, raid]) => raid.summary)
    .map(([slug, raid]) => `- ${titleCase(slug)}: ${raid.summary}`);
  const runs = (character.mythic_plus_best_runs ?? []).map((run) => {
    const result = run.num_keystone_upgrades ? `timed +${run.num_keystone_upgrades}` : 'not timed';
    return `- ${run.dungeon} +${run.mythic_level}, ${result}, ${duration(run.clear_time_ms)}, ${run.completed_at?.slice(0, 10)}`;
  });
  return [
    `# ${character.name}, ${character.race} ${character.active_spec_name} ${character.class}, ${character.realm} ${character.region.toUpperCase()}\n${character.profile_url}`,
    facts.filter(Boolean).join('\n'),
    section('Raid progression', raids.join('\n')),
    section('Best Mythic+ runs', runs.join('\n')),
  ].filter(Boolean).join('\n\n');
}

// Affixes rotate on the same schedule in every region.
export async function getAffixes() {
  const week = await (await request(`${API}/mythic-plus/affixes?region=us&locale=en`)).json();
  const affixes = week.affix_details.map((affix) => `- ${affix.name}: ${affix.description}`);
  return section(`This week's Mythic+ affixes: ${week.title}`, [...affixes, week.leaderboard_url].join('\n'));
}

function titleCase(slug) {
  return slug.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function duration(ms) {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
