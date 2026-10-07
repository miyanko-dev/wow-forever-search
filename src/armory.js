import { readVar } from './embedded.js';
import { request } from './http.js';
import { section } from './text.js';

const SITE = 'https://worldofwarcraft.blizzard.com/en-us/character';

// The official armory page carries the character as JSON, the same data Blizzard's profile API serves.
export async function getArmoryCharacter(region, realm, name) {
  const url = `${SITE}/${region}/${realmSlug(realm)}/${encodeURIComponent(name.toLowerCase())}`;
  let html;
  try {
    html = await (await request(url)).text();
  } catch (error) {
    if (!/answered (404|500)/.test(error.message)) throw error;

    // The armory answers 500 for unknown characters and for ones that haven't logged in for a long time.
    throw new Error(`Blizzard's armory has no character ${name} on ${realm} (${region.toUpperCase()}). Check the spelling, realm and region.`);
  }
  const character = readVar(html, 'characterProfileInitialState')?.character;
  if (!character) throw new Error(`Blizzard's armory page for ${name} on ${realm} had no character data.`);

  const facts = [
    `- Item level ${character.averageItemLevel}, ${character.achievement} achievement points`,
    character.dungeonRating?.rating && `- Mythic+ rating ${character.dungeonRating.rating}`,
    character.guild && `- Guild ${character.guild.name} on ${character.guild.realm?.name}`,
    `- Armory data from ${character.lastUpdatedTimestamp?.iso8601?.slice(0, 10)}`,
  ];
  // Shirts and tabards are cosmetic and sit at item level 1.
  const gear = Object.values(character.gear ?? {})
    .filter((item) => item.level?.value > 1)
    .map((item) => `- ${item.slot?.name}: ${item.name} (${item.level.value})`);
  return [
    `# ${character.name}, level ${character.level} ${character.race?.name} ${character.spec?.name ?? ''} ${character.class?.name}, ${character.realm?.name} ${region.toUpperCase()}`
      + `\nhttps://worldofwarcraft.blizzard.com/en-us${character.url ?? ''}`,
    facts.filter(Boolean).join('\n'),
    section('Gear', gear.join('\n')),
  ].filter(Boolean).join('\n\n').replace(/ {2,}/g, ' ');
}

// Realm slugs drop apostrophes, accents and parentheses and join words with hyphens, like Mal'Ganis to malganis.
function realmSlug(realm) {
  return realm.normalize('NFD').replace(/[̀-ͯ'()]/g, '').trim().toLowerCase().replace(/\s+/g, '-');
}
