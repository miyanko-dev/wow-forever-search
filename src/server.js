import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import pkg from '../package.json' with { type: 'json' };
import { getNews, getWowheadPage, lookup, pagePart } from './wowhead.js';

const CACHE_MS = 60 * 60 * 1000;
const CACHE_SIZE = 300;
const cache = new Map();

const hints = { readOnlyHint: true, openWorldHint: true };

// The sources have no paid API, so repeated lookups are answered from memory to keep traffic low.
async function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_MS) return hit.value;
  const value = await load();
  cache.delete(key);
  cache.set(key, { time: Date.now(), value });
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return value;
}

function text(value) {
  return { content: [{ type: 'text', text: value }] };
}

async function search(query) {
  const rows = await lookup(query);
  return rows || `Nothing in WoW Forever named like "${query}". Try an English name, fewer words, get_news, `
    + 'or the guide hub https://www.wowhead.com/forever/guides with get_page.';
}

function readPage(url) {
  const { hostname } = new URL(url, 'https://www.wowhead.com/');
  if (hostname === 'www.wowhead.com' || hostname === 'wowhead.com') return getWowheadPage(url);
  throw new Error(`get_page reads WoW Forever pages on www.wowhead.com, not ${url}.`);
}

// Other hosts, such as a Cloudflare Worker, connect to the same tools without stdio.
export function createServer() {
  const server = new McpServer({ name: 'wow-forever-search', version: pkg.version });

  server.registerTool('search', {
    title: 'Search WoW Forever',
    description: 'Find WoW Forever items, NPCs, quests and spells by name in Wowhead\'s WoW Forever database. '
      + 'Returns Wowhead URLs to open with get_page.',
    inputSchema: z.object({ query: z.string().min(1).max(100).describe('Name or part of it, in English') }),
    annotations: hints,
  }, async ({ query }) => text(await cached(`search:${query.toLowerCase()}`, () => search(query))));

  server.registerTool('get_page', {
    title: 'Read a WoW Forever page',
    description: 'Read a WoW Forever page on Wowhead as text: tooltip, quick facts, map coordinates, quest text, drop sources with chances, '
      + 'vendors, rewards, abilities, guides and top WoW Forever comments. The guide hub https://www.wowhead.com/forever/guides lists the guides. '
      + 'Pages of other WoW versions are refused. '
      + 'Long pages, like patch notes, come in parts that end with the offset of the next part.',
    inputSchema: z.object({
      url: z.string().min(1).max(300).describe('Wowhead URL from search results or the user, like https://www.wowhead.com/forever/item=19019'),
      offset: z.number().int().min(0).default(0).describe('Where to continue a long page, from the end of the previous part'),
    }),
    annotations: hints,
  }, async ({ url, offset }) => text(pagePart(await cached(`page:${url}`, () => readPage(url)), offset)));

  server.registerTool('get_news', {
    title: 'Latest WoW Forever news',
    description: 'The 10 latest WoW Forever news posts on Wowhead, newest first, with dates, URLs and summaries: '
      + 'beta builds, patch notes and class changes.',
    inputSchema: z.object({}),
    annotations: hints,
  }, async () => text(await cached('news', () => getNews())));

  return server;
}
