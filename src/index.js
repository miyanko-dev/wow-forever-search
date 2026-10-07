#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

import pkg from '../package.json' with { type: 'json' };
import { getAffixes, getCharacter, REGIONS } from './raiderio.js';
import { section } from './text.js';
import { getWikiPage, searchWiki } from './wiki.js';
import { GAMES, getNews, getWowheadPage, lookup } from './wowhead.js';

const CACHE_MS = 60 * 60 * 1000;
const CACHE_SIZE = 300;
const cache = new Map();

const game = z.enum(GAMES).default('retail').describe(
  'Game version: retail is the current game, classic is Classic Era, forever is WoW Forever, '
  + 'tbc, wotlk, cata and mop-classic are the Classic progression versions, ptr, ptr-2 and classic-ptr are test realms',
);
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

async function search(query, game) {
  const [wiki, wowhead] = await Promise.allSettled([searchWiki(query, game), lookup(query, game)]);
  const parts = [settled('Warcraft Wiki', wiki), settled(`Wowhead database (${game})`, wowhead)].filter(Boolean);
  return parts.join('\n\n') || `Nothing found for "${query}". Try fewer or other words, in English.`;
}

// A source that failed still shows up, so the model can tell an outage from an empty result.
function settled(heading, result) {
  return section(heading, result.status === 'rejected' ? `Error: ${result.reason.message}` : result.value);
}

function readPage(url) {
  const { hostname } = new URL(url, 'https://www.wowhead.com/');
  if (hostname === 'warcraft.wiki.gg') return getWikiPage(url);
  if (hostname === 'www.wowhead.com' || hostname === 'wowhead.com') return getWowheadPage(url);
  throw new Error(`get_page reads www.wowhead.com and warcraft.wiki.gg pages, not ${url}. For Raider.IO characters, use the character tool.`);
}

async function news(game) {
  const [affixes, posts] = await Promise.all([game === 'retail' ? getAffixes().catch(() => '') : '', getNews(game)]);
  return [affixes, posts].filter(Boolean).join('\n\n');
}

serveStdio(() => {
  const server = new McpServer({ name: 'wow-info', version: pkg.version });

  server.registerTool('search', {
    title: 'Search WoW sources',
    description: 'Find World of Warcraft topics, items, NPCs and quests. Searches Warcraft Wiki (lore, mechanics, classes, '
      + 'zones, events) and Wowhead\'s database for the game version. Returns links to open with get_page.',
    inputSchema: z.object({ query: z.string().min(1).max(100).describe('Name or keywords, in English'), game }),
    annotations: hints,
  }, async ({ query, game }) => text(await cached(`search:${game}:${query.toLowerCase()}`, () => search(query, game))));

  server.registerTool('get_page', {
    title: 'Read a WoW page',
    description: 'Read a Wowhead or Warcraft Wiki page as text. Wowhead pages give the tooltip, quick facts, map coordinates, '
      + 'quest text, drop sources with chances, vendors, rewards, guides and top comments. Wiki articles give lore and mechanics.',
    inputSchema: z.object({
      url: z.string().min(1).max(300).describe('URL from search results or the user, like https://www.wowhead.com/classic/item=19019'),
    }),
    annotations: hints,
  }, async ({ url }) => text(await cached(`page:${url}`, () => readPage(url))));

  server.registerTool('get_news', {
    title: 'Latest WoW news',
    description: 'The 10 latest Wowhead news posts for a game version, newest first, with dates, URLs and summaries. '
      + 'For retail it also lists this week\'s Mythic+ affixes from Raider.IO.',
    inputSchema: z.object({ game }),
    annotations: hints,
  }, async ({ game }) => text(await cached(`news:${game}`, () => news(game))));

  server.registerTool('character', {
    title: 'Raider.IO character',
    description: 'Look up a retail character on Raider.IO: item level, Mythic+ score and best runs, raid progression and guild.',
    inputSchema: z.object({
      region: z.enum(REGIONS).describe('Region of the realm'),
      realm: z.string().min(1).max(60).describe('Realm name, like Tarren Mill'),
      name: z.string().min(1).max(40).describe('Character name'),
    }),
    annotations: hints,
  }, async ({ region, realm, name }) => text(await cached(`character:${region}:${realm}:${name}`.toLowerCase(), () => getCharacter(region, realm, name))));

  return server;
});
