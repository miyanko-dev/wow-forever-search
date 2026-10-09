import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getArmoryCharacter } from '../src/armory.js';
import { getAffixes, getRaiderIo } from '../src/raiderio.js';
import { htmlToText, markupToText } from '../src/text.js';
import { getNews, getWowheadPage, lookup, pagePart } from '../src/wowhead.js';

// The live checks read every source, so they fail when a layout or API the parsers rely on changes.

test('Wowhead lookup finds WoW Forever items, quests and spells by name in the database listings', async () => {
  const text = await lookup('thunderfury');
  assert.match(text, /- Thunderfury, Blessed Blade of the Windseeker \(item\) https:\/\/www\.wowhead\.com\/forever\/item=19019/);
  assert.match(text, /- Rise, Thunderfury! \(quest\) https:\/\/www\.wowhead\.com\/forever\/quest=7787/);
  assert.match(await lookup('shifting power'), /- Shifting Power \(spell\) https:\/\/www\.wowhead\.com\/forever\/spell=\d+/);
});

test('lookups never request paths Wowhead disallows for bots', async () => {
  const urls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => {
    urls.push(String(url));
    return realFetch(url, init);
  };
  try {
    await Promise.all([lookup('onyxia'), lookup('onyxia', 'classic')]);
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

test('news lists recent posts with dates and links', async () => {
  const text = await getNews('forever');
  assert.match(text, /^- \d{4}-\d{2}-\d{2} .+\n {2}https:\/\/www\.wowhead\.com\/news=\d+/);
});

test('the official armory returns a retail character with gear, and a clear miss', async () => {
  const text = await getArmoryCharacter('eu', 'Draenor', 'Moadzarella');
  assert.match(text, /^# Moadzarella, level \d+ .+, Draenor EU\nhttps:\/\/worldofwarcraft\.blizzard\.com\/en-us\/.+\/moadzarella/);
  assert.match(text, /## Gear\n- \w+/);
  await assert.rejects(getArmoryCharacter('eu', 'Draenor', 'Zzqqxxnobody'), /armory has no character Zzqqxxnobody on Draenor \(EU\)/);
});

test('Raider.IO adds Mythic+ runs, this week\'s affixes and clear misses', async () => {
  const text = await getRaiderIo('eu', 'Draenor', 'Moadzarella');
  assert.match(text, /^## Raider\.IO\nhttps:\/\/raider\.io\/characters\/eu\/draenor\/Moadzarella\n- Mythic\+ score/);
  assert.match(await getAffixes(), /^## This week's Mythic\+ affixes: .+\n- /);
  await assert.rejects(getRaiderIo('eu', 'Draenor', 'Zzqqxxnobody'), /Could not find requested character/);
});

test('Wowhead pages refuse other hosts', async () => {
  await assert.rejects(getWowheadPage('https://example.com/item=1'), /Not a Wowhead URL/);
  await assert.rejects(getWowheadPage('//example.com/item=1'), /Not a Wowhead URL/);
});

test('markup becomes text with entity names and coins', () => {
  const names = new Map([['item', 'x'], ['item=19019', 'Thunderfury']]);
  const markup = '[b]Get[/b] [item=19019] and [quest=7787] for [money=123456].[ul][li]One[/li][/ul][tooltip name=x]hidden[/tooltip][Bracketed]';
  assert.equal(markupToText(markup, names), 'Get Thunderfury and quest 7787 for 12g 34s 56c.\n- One\n[Bracketed]');
});

test('patch notes keep old and new values and section names', () => {
  const markup = '[toggler name="Hunter" size=3]Bite for [del copy=true]5[/del][ins]10[/ins] sec[ins] at once[/ins].[del]Old line[/del]';
  assert.equal(markupToText(markup), '## Hunter\nBite for 10 (was 5) sec(new: at once).(removed: Old line)');
});

test('long pages come in parts that end at a line break and name the next offset', () => {
  const page = `${'a'.repeat(9000)}\n${'b'.repeat(9000)}`;
  assert.match(pagePart(page), /^a{9000}\n\n\[Part ends at 9000 of 18001 characters\. Call get_page with offset 9000/);
  assert.equal(pagePart(page, 9000), `\n${'b'.repeat(9000)}`);
  assert.match(pagePart(page, 20000), /^Nothing at offset 20000/);
});

test('tooltip html becomes lines with coin units', () => {
  const html = '<table><tr><td><b>Sword</b><br>Unique<div class="x">Classes: Rogue</div>Sell Price: <span class="moneygold">2</span> <span class="moneysilver">5</span></td></tr></table>';
  assert.equal(htmlToText(html), 'Sword\nUnique\nClasses: Rogue\nSell Price: 2g 5s');
});
