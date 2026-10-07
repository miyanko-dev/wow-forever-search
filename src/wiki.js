import { request } from './http.js';
import { section, truncate } from './text.js';
import { wowheadUrl } from './wowhead.js';

const API = 'https://warcraft.wiki.gg/api.php';
const PAGE_CHARS = 12_000;

// Articles link their entity on Wowhead, which get_page opens for drop chances, coordinates and comments.
const WOWHEAD_LINKS = { ellimit: 'max', elprotocol: 'https', elquery: 'www.wowhead.com/' };

// One MediaWiki call returns the ranked hits with their intro and Wowhead links.
export async function searchWiki(query, game = 'retail') {
  const data = await api({
    action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '5', prop: 'extracts|extlinks|info',
    exintro: '1', explaintext: '1', exsentences: '2', exlimit: 'max', inprop: 'url', ...WOWHEAD_LINKS,
  });
  const pages = (data.query?.pages ?? []).sort((a, b) => a.index - b.index);
  return pages.map((page) => {
    const summary = page.extract ? `\n  ${truncate(page.extract.replace(/\s+/g, ' '), 240)}` : '';
    const links = wowheadLinks(page, game).slice(0, 3);
    return `- ${page.title} ${page.fullurl}${summary}${links.length ? `\n  Wowhead: ${links.join(' ')}` : ''}`;
  }).join('\n');
}

export async function getWikiPage(input) {
  const url = new URL(input);
  const title = decodeURIComponent(url.pathname.replace(/^\/wiki\//, '')).replaceAll('_', ' ');
  if (!url.pathname.startsWith('/wiki/') || !title) throw new Error(`Not a Warcraft Wiki article: ${input}`);
  const data = await api({
    action: 'query', titles: title, redirects: '1', prop: 'extracts|extlinks|info', explaintext: '1', inprop: 'url', ...WOWHEAD_LINKS,
  });
  const page = data.query?.pages?.[0];
  if (!page || page.missing) throw new Error(`Warcraft Wiki has no article "${title}". Find the title with search.`);
  const links = [...new Set((page.extlinks ?? []).map((link) => link.url))].slice(0, 10);
  return truncate([
    `# ${page.title} - Warcraft Wiki\n${page.fullurl}`,
    page.extract?.trim(),
    section('Wowhead', links.join('\n')),
  ].filter(Boolean).join('\n\n'), PAGE_CHARS);
}

// The wiki links retail and Classic pages; the ids carry over, so they're rebuilt for the asked game.
function wowheadLinks(page, game) {
  const ids = new Set();
  for (const { url } of page.extlinks ?? []) {
    const match = url.match(/wowhead\.com\/(?:[a-z-]+\/)?([a-z-]+)=(\d+)/);
    if (match) ids.add(`${match[1]}=${match[2]}`);
  }
  return [...ids].map((key) => wowheadUrl(game, ...key.split('=')));
}

async function api(params) {
  const response = await request(`${API}?${new URLSearchParams({ ...params, format: 'json', formatversion: '2' })}`);
  const data = await response.json();
  if (data.error) throw new Error(`Warcraft Wiki: ${data.error.info}`);
  return data;
}
