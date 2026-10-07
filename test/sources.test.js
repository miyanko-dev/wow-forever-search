import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getAffixes, getCharacter } from '../src/raiderio.js';
import { htmlToText, markupToText } from '../src/text.js';
import { getWikiPage, searchWiki } from '../src/wiki.js';
import { getNews, getWowheadPage, lookup } from '../src/wowhead.js';

// The live checks read every source, so they fail when a layout or API the parsers rely on changes.

test('wiki search returns articles with Wowhead links for the chosen game', async () => {
  const text = await searchWiki('thunderfury', 'classic');
  assert.match(text, /- Thunderfury, Blessed Blade of the Windseeker https:\/\/warcraft\.wiki\.gg\/wiki\//);
  assert.match(text, /Wowhead: https:\/\/www\.wowhead\.com\/classic\/item=19019/);
});

test('Wowhead lookup finds items, NPCs and quests by name in the database listings', async () => {
  const text = await lookup('thunderfury', 'forever');
  assert.match(text, /- Thunderfury, Blessed Blade of the Windseeker \(item\) https:\/\/www\.wowhead\.com\/forever\/item=19019/);
  assert.match(text, /- Rise, Thunderfury! \(quest\) https:\/\/www\.wowhead\.com\/forever\/quest=7787/);
});

test('lookups never request paths Wowhead disallows for bots', async () => {
  const urls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => {
    urls.push(String(url));
    return realFetch(url, init);
  };
  try {
    await Promise.all([lookup('onyxia', 'classic'), searchWiki('onyxia', 'classic')]);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.ok(urls.length > 0);
  for (const url of urls) assert.doesNotMatch(url, /wowhead\.com\/(?:[a-z-]+\/)?(?:search|list|account|random)\b/);
});

test('item page has tooltip, drop sources with chances and comments', async () => {
  const text = await getWowheadPage('https://www.wowhead.com/classic/item=18563');
  assert.match(text, /## Tooltip\nBindings of the Windseeker\nItem Level 70/);
  assert.match(text, /- Baron Geddon \(npc=12056\): [\d.]+% chance, Molten Core/);
  assert.match(text, /## Top comments\n- \(\+\d+, \d{4}-\d{2}-\d{2}\)/);
});

test('quest page has the quest text', async () => {
  const text = await getWowheadPage('classic/quest=7787');
  assert.match(text, /## Description\nYou have defeated the Wind Seeker/);
});

test('npc page has map coordinates and abilities', async () => {
  const npc = await getWowheadPage('classic/npc=14347');
  assert.match(npc, /## Locations\n- Silithus: \d+\.?\d*, \d+\.?\d*/);
  const boss = await getWowheadPage('classic/npc=12056');
  assert.match(boss, /## abilities \(\d+\)\n[\s\S]*Living Bomb \(spell=20475\)/);
});

test('guide page has the guide body', async () => {
  const text = await getWowheadPage('classic/guide=7671');
  assert.match(text, /## Article\n[\s\S]*Highlord Demetrian/);
});

test('wiki page has the article text and its Wowhead links', async () => {
  const text = await getWikiPage('https://warcraft.wiki.gg/wiki/Thunderfury,_Blessed_Blade_of_the_Windseeker');
  assert.match(text, /^# Thunderfury, Blessed Blade of the Windseeker - Warcraft Wiki/);
  assert.match(text, /legendary sword/);
  assert.match(text, /## Wowhead\n[\s\S]*https:\/\/www\.wowhead\.com\/item=19019/);
});

test('news lists recent posts with dates and links', async () => {
  const text = await getNews('forever');
  assert.match(text, /^- \d{4}-\d{2}-\d{2} .+\n {2}https:\/\/www\.wowhead\.com\/news=\d+/);
});

test('Raider.IO returns a character profile, this week\'s affixes and clear misses', async () => {
  const character = await getCharacter('eu', 'Tarren Mill', 'Naowh');
  assert.match(character, /^# Naowh, .+, Tarren Mill EU\nhttps:\/\/raider\.io\/characters\/eu\/tarren-mill\/Naowh/);
  assert.match(await getAffixes(), /^## This week's Mythic\+ affixes: .+\n- /);
  await assert.rejects(getCharacter('eu', 'Tarren Mill', 'Zzqqxxnobody'), /Could not find requested character/);
});

test('get_page sources refuse other hosts', async () => {
  await assert.rejects(getWowheadPage('https://example.com/item=1'), /Not a Wowhead URL/);
  await assert.rejects(getWowheadPage('//example.com/item=1'), /Not a Wowhead URL/);
  await assert.rejects(getWikiPage('https://warcraft.wiki.gg/index.php'), /Not a Warcraft Wiki article/);
});

test('markup becomes text with entity names and coins', () => {
  const names = new Map([['item', 'x'], ['item=19019', 'Thunderfury']]);
  const markup = '[b]Get[/b] [item=19019] and [quest=7787] for [money=123456].[ul][li]One[/li][/ul][tooltip name=x]hidden[/tooltip][Bracketed]';
  assert.equal(markupToText(markup, names), 'Get Thunderfury and quest 7787 for 12g 34s 56c.\n- One\n[Bracketed]');
});

test('tooltip html becomes lines with coin units', () => {
  const html = '<table><tr><td><b>Sword</b><br>Unique<div class="x">Classes: Rogue</div>Sell Price: <span class="moneygold">2</span> <span class="moneysilver">5</span></td></tr></table>';
  assert.equal(htmlToText(html), 'Sword\nUnique\nClasses: Rogue\nSell Price: 2g 5s');
});
