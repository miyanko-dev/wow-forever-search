import assert from 'node:assert/strict';
import { test } from 'node:test';

import { htmlToText, markupToText } from '../src/text.js';
import { getNews, getPage, search } from '../src/wowhead.js';

// The live checks read wowhead.com, so they fail when a page layout the parser relies on changes.

test('search returns matches with URLs for the chosen game', async () => {
  const text = await search('thunderfury', 'classic');
  assert.match(text, /Thunderfury, Blessed Blade of the Windseeker \(Item\) https:\/\/www\.wowhead\.com\/classic\/item=19019/);
});

test('item page has tooltip, drop sources with chances and comments', async () => {
  const text = await getPage('https://www.wowhead.com/classic/item=18563');
  assert.match(text, /## Tooltip\nBindings of the Windseeker\nItem Level 70/);
  assert.match(text, /- Baron Geddon \(npc=12056\): [\d.]+% chance, Molten Core/);
  assert.match(text, /## Top comments\n- \(\+\d+, \d{4}-\d{2}-\d{2}\)/);
});

test('quest page has the quest text', async () => {
  const text = await getPage('classic/quest=7787');
  assert.match(text, /## Description\nYou have defeated the Wind Seeker/);
});

test('npc page has map coordinates', async () => {
  const text = await getPage('classic/npc=14347');
  assert.match(text, /## Locations\n- Silithus: \d+\.?\d*, \d+\.?\d*/);
});

test('guide page has the guide body', async () => {
  const text = await getPage('classic/guide=7671');
  assert.match(text, /## Article\n[\s\S]*Highlord Demetrian/);
});

test('news lists recent posts with dates and links', async () => {
  const text = await getNews('forever');
  assert.match(text, /^- \d{4}-\d{2}-\d{2} .+\n {2}https:\/\/www\.wowhead\.com\/news=\d+/);
});

test('get_page refuses hosts other than Wowhead', async () => {
  await assert.rejects(getPage('https://example.com/item=1'), /Not a Wowhead URL/);
  await assert.rejects(getPage('//example.com/item=1'), /Not a Wowhead URL/);
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
