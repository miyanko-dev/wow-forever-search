import { balanced, parseJson, readVar, stringEnd } from './embedded.js';
import { request } from './http.js';
import { decodeEntities, formatMoney, htmlToText, markupToText, section, truncate } from './text.js';

const SITE = 'https://www.wowhead.com';
const TOOLTIPS = 'https://nether.wowhead.com';
const PAGE_CHARS = 12_000;
const LIST_ROWS = 12;
const LOOKUP_ROWS = 5;

// Each game version is a URL prefix on Wowhead; retail has none.
export const GAMES = ['retail', 'classic', 'tbc', 'wotlk', 'cata', 'mop-classic', 'forever', 'ptr', 'ptr-2', 'classic-ptr'];

// Wowhead type ids from page data, mapped to their URL slugs.
const TYPES = {
  1: 'npc', 2: 'object', 3: 'item', 4: 'item-set', 5: 'quest', 6: 'spell', 7: 'zone', 8: 'faction', 9: 'pet',
  10: 'achievement', 11: 'title', 12: 'event', 13: 'class', 14: 'race', 15: 'skill', 17: 'currency',
  20: 'building', 22: 'mission-ability', 26: 'threat', 100: 'guide', 101: 'transmog-set', 162: 'news',
};

// The tooltip endpoint answers only for these types.
const TOOLTIP_TYPES = new Set(['npc', 'object', 'item', 'item-set', 'quest', 'spell', 'zone', 'achievement', 'currency']);

// Listview templates whose rows are entities with their own page.
const ENTITY_TEMPLATES = new Set(['npc', 'object', 'item', 'itemset', 'quest', 'spell', 'zone', 'faction', 'achievement', 'currency', 'title', 'event', 'skill', 'pet', 'guide']);

// Related lists that hold media, community posts or cosmetics rather than game facts.
const SKIPPED_LISTS = new Set(['comments', 'screenshots', 'videos', 'videos-english', 'sounds', 'outfits', 'outfit', 'transmog-with', 'same-model-as', 'news', 'news-comments']);

// Database listings that /search would cover, keyed by their URL with the type of their rows.
const LOOKUP_LISTS = { items: 'item', npcs: 'npc', quests: 'quest', spells: 'spell' };

function wowheadUrl(game, type, id) {
  return `${SITE}/${prefix(game)}${type}=${id}`;
}

// Wowhead's robots.txt disallows /search for bots, so names are matched in the database listings,
// like /forever/quests/name:library, which also cover the newest WoW Forever beta content.
export async function lookup(query, game = 'forever') {
  const lists = await Promise.all(Object.entries(LOOKUP_LISTS).map(async ([list, type]) => {
    const response = await request(`${SITE}/${prefix(game)}${list}/name:${encodeURIComponent(query)}`);
    const rows = listviews(await response.text()).find((view) => view.id === list)?.rows ?? [];
    rows.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return rows.slice(0, LOOKUP_ROWS).map((row) => `- ${row.name ?? row.displayName} (${type}) ${wowheadUrl(game, type, row.id)}`);
  }));
  return lists.flat().join('\n');
}

export async function getWowheadPage(input) {
  const response = await request(pageUrl(input));
  const html = await response.text();
  const names = gathererNames(html);
  const blocks = markupBlocks(html, names);
  const pageInfo = html.match(/g_pageInfo\s*=\s*\{[^}]*\}/)?.[0] ?? '';
  const type = TYPES[pageInfo.match(/\btype"?\s*:\s*(\d+)/)?.[1]];
  const id = pageInfo.match(/\btypeId"?\s*:\s*(\d+)/)?.[1];

  // Guides and news posts are one long article; database pages spread their facts over many parts.
  const isEntity = Boolean(type && id) && type !== 'guide' && type !== 'news';
  const quickFacts = blocks.filter((block) => block.target?.startsWith('infobox'));
  const article = blocks.filter((block) => !quickFacts.includes(block)).map((block) => block.text).join('\n\n');

  const sections = [
    `# ${decodeEntities(html.match(/<title>([^<]*)/)?.[1] ?? '')}\n${response.url}`,
    decodeEntities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''),
    TOOLTIP_TYPES.has(type) ? section('Tooltip', await tooltip(gameOf(response.url), type, id)) : '',
    section('Quick facts', quickFacts.map((block) => block.text).join('\n')),
    section('Locations', locations(html)),
    isEntity ? section('Page text', truncate(mainText(html), 3000)) : '',
    ...relatedLists(html, names),
    section('Article', isEntity ? truncate(article, 4000) : article),
    section('Top comments', topComments(html, names)),
  ];
  return truncate(sections.filter(Boolean).join('\n\n'), PAGE_CHARS);
}

export async function getNews(game = 'forever') {
  const response = await request(`${SITE}/news/rss/${newsFeed(game)}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10).map(([, item]) => {
    const field = (name) => decodeEntities(item.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1] ?? '');
    const posted = new Date(field('pubDate'));
    const date = Number.isNaN(posted.getTime()) ? '' : posted.toISOString().slice(0, 10);
    const summary = htmlToText(field('description')).replace(/Continue reading[\s\S]*$/, '').trim();
    return `- ${date} ${field('title')}\n  ${field('link')}\n  ${truncate(summary, 300)}`;
  });
  return items.join('\n') || 'No news found.';
}

function prefix(game) {
  return game === 'retail' ? '' : `${game}/`;
}

function gameOf(url) {
  const first = new URL(url).pathname.split('/')[1];
  return GAMES.includes(first) ? first : 'retail';
}

// Wowhead's feeds: the classic series covers every Classic version, WoW Forever also has its own.
function newsFeed(game) {
  if (game === 'forever') return 'forever';
  return ['retail', 'ptr', 'ptr-2'].includes(game) ? 'retail' : 'classic-series';
}

// Only Wowhead pages are fetched, so the tool can't be pointed at other hosts.
function pageUrl(input) {
  const url = new URL(input, `${SITE}/`);
  if (url.hostname !== 'www.wowhead.com' && url.hostname !== 'wowhead.com') {
    throw new Error(`Not a Wowhead URL: ${input}. Pass a URL like ${SITE}/classic/item=19019.`);
  }
  return `${SITE}${url.pathname}${url.search}`;
}

async function tooltip(game, type, id) {
  try {
    const response = await request(`${TOOLTIPS}/${prefix(game)}tooltip/${type}/${id}`);
    return htmlToText((await response.json()).tooltip ?? '');
  } catch {
    // The rest of the page still answers most questions.
    return '';
  }
}

// Pages name every entity they link once, in WH.Gatherer.addData(type, env, {id: {name_enus}}).
function gathererNames(html) {
  const names = new Map();
  for (const match of html.matchAll(/WH\.Gatherer\.addData\((\d+),\s*\d+,\s*(?=\{)/g)) {
    const type = TYPES[match[1]];
    const entities = type && parseJson(balanced(html, match.index + match[0].length));
    for (const [id, entity] of Object.entries(entities ?? {})) {
      const name = entity.name_enus ?? entity.name;
      if (name) names.set(`${type}=${id}`, name);
    }
  }
  return names;
}

// Quick facts, articles, guides and news bodies are markup strings passed to WH.markup.printHtml("...", "target").
function markupBlocks(html, names) {
  const blocks = [];
  for (const match of html.matchAll(/WH\.markup\.printHtml\(\s*(?=")/g)) {
    const start = match.index + match[0].length;
    const end = stringEnd(html, start);
    const target = html.slice(end + 1, end + 200).match(/^\s*,\s*"([^"]+)"/)?.[1];
    try {
      blocks.push({ target, text: markupToText(JSON.parse(html.slice(start, end + 1)), names) });
    } catch {
      // A literal with JavaScript-only escapes is skipped.
    }
  }
  return blocks;
}

// Quest text, spell details and NPC notes sit in the main column between its heading and the Guides or Related tabs.
function mainText(html) {
  const column = html.indexOf('<div class="text">');
  const start = column < 0 ? -1 : html.indexOf('<h1', column);
  if (start < 0) return '';
  const body = html.slice(start);
  const end = body.search(/<h2[^>]*>(Guides|Related)<\/h2>|tabsRelated/);
  return htmlToText(end > 0 ? body.slice(0, end) : body);
}

function locations(html) {
  const zones = Object.values(readVar(html, 'g_mapperData') ?? {}).flat();
  return zones.filter((zone) => zone.coords?.length).map((zone) => {
    const coords = zone.coords.slice(0, 3).map(([x, y]) => `${x}, ${y}`).join(' | ');
    const more = zone.coords.length > 3 ? ` (+${zone.coords.length - 3} more)` : '';
    return `- ${zone.uiMapName ?? 'Map'}: ${coords}${more}`;
  }).join('\n');
}

// Related tabs and database listings are `new Listview({id: 'dropped-by', template: 'npc', data: [...]})`,
// where data is an inline array or a variable holding one, like `data: listviewitems`.
function listviews(html) {
  const views = [];
  for (const match of html.matchAll(/new Listview\(\s*(?=\{)/g)) {
    const config = balanced(html, match.index + match[0].length);
    const data = config.match(/\bdata"?\s*:\s*(\[|[A-Za-z_$][\w$]*(?=\s*[,}]))/);
    if (!data) continue;
    const head = config.slice(0, data.index);
    const id = head.match(/\bid"?\s*:\s*["']([^"']+)/)?.[1];
    const template = head.match(/\btemplate"?\s*:\s*["']([^"']+)/)?.[1];
    if (!id || SKIPPED_LISTS.has(id)) continue;
    const rows = data[1] === '[' ? parseJson(balanced(config, data.index + data[0].length - 1)) : readVar(html, data[1]);
    if (Array.isArray(rows) && rows.length) views.push({ id, template, rows });
  }
  return views;
}

function relatedLists(html, names) {
  return listviews(html).map(({ id, template, rows }) => {

    // Best quality first, then highest drop chance, so a capped list keeps what players ask about.
    rows.sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0) || dropChance(b) - dropChance(a));
    const lines = rows.slice(0, LIST_ROWS).map((row) => listRow(row, template, names));
    if (rows.length > LIST_ROWS) lines.push(`- and ${rows.length - LIST_ROWS} more`);
    return section(`${id} (${rows.length})`, lines.join('\n'));
  });
}

function listRow(row, template, names) {
  const name = row.name ?? row.title ?? row.subject ?? `#${row.id}`;
  const slug = template === 'itemset' ? 'item-set' : template;
  const link = ENTITY_TEMPLATES.has(template) && row.id ? ` (${slug}=${row.id})` : '';
  const facts = [];
  const chance = dropChance(row);
  if (chance) facts.push(`${Number((chance * 100).toPrecision(2))}% chance`);
  const zones = (row.location ?? []).map((zone) => names.get(`zone=${zone}`)).filter(Boolean);
  if (zones.length) facts.push(zones.slice(0, 2).join(', '));
  const copper = Array.isArray(row.cost?.[0]) ? row.cost[0][0] : row.cost?.[0];
  if (copper > 0) facts.push(`costs ${formatMoney(copper)}`);
  return `- ${name}${link}${facts.length ? `: ${facts.join(', ')}` : ''}`;
}

function dropChance(row) {
  return row.count > 0 && row.outof > 0 ? row.count / row.outof : 0;
}

function topComments(html, names) {
  const comments = readVar(html, 'lv_comments0') ?? [];
  return comments
    .filter((comment) => !comment.deleted && !comment.outofdate)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map((comment) => {
      const body = markupToText(comment.body ?? '', names).replace(/\s+/g, ' ');
      return `- (${comment.rating > 0 ? '+' : ''}${comment.rating}, ${comment.date?.slice(0, 10)}) ${truncate(body, 500)}`;
    })
    .join('\n');
}
