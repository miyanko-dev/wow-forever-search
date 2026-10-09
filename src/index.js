#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

import pkg from '../package.json' with { type: 'json' };
import { getArmoryCharacter } from './armory.js';
import { getAffixes, getRaiderIo, REGIONS } from './raiderio.js';
import { GAMES, getNews, getWowheadPage, lookup, pagePart } from './wowhead.js';

const CACHE_MS = 60 * 60 * 1000;
const CACHE_SIZE = 300;
const cache = new Map();

const game = z.enum(GAMES).default('forever').describe(
  'Game version: forever is WoW Forever, the default. retail is the current game, classic is Classic Era, '
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
  const rows = await lookup(query, game);
  return rows || `Nothing on Wowhead named like "${query}" in ${game}. Try an English name, fewer words, get_news, `
    + `or the guide hub https://www.wowhead.com/${game === 'retail' ? '' : `${game}/`}guides with get_page.`;
}

function readPage(url) {
  const { hostname } = new URL(url, 'https://www.wowhead.com/');
  if (hostname === 'www.wowhead.com' || hostname === 'wowhead.com') return getWowheadPage(url);
  throw new Error(`get_page reads www.wowhead.com pages, not ${url}. For a character, use the character tool.`);
}

async function news(game) {
  const [affixes, posts] = await Promise.all([game === 'retail' ? getAffixes().catch(() => '') : '', getNews(game)]);
  return [affixes, posts].filter(Boolean).join('\n\n');
}

// The armory is the official profile; Raider.IO adds Mythic+ runs. Either one alone still answers.
async function character(region, realm, name) {
  const [armory, raiderIo] = await Promise.allSettled([getArmoryCharacter(region, realm, name), getRaiderIo(region, realm, name)]);
  if (armory.status === 'rejected' && raiderIo.status === 'rejected') throw armory.reason;
  return [
    armory.status === 'fulfilled' ? armory.value : `Armory: ${armory.reason.message}`,
    raiderIo.status === 'fulfilled' ? raiderIo.value : `Raider.IO: ${raiderIo.reason.message}`,
  ].join('\n\n');
}

serveStdio(() => {
  const server = new McpServer({ name: 'wow-forever-search', version: pkg.version });

  server.registerTool('search', {
    title: 'Search Wowhead',
    description: 'Find items, NPCs, quests and spells by name in Wowhead\'s database for a game version, WoW Forever by default. '
      + 'Returns Wowhead URLs to open with get_page.',
    inputSchema: z.object({ query: z.string().min(1).max(100).describe('Name or part of it, in English'), game }),
    annotations: hints,
  }, async ({ query, game }) => text(await cached(`search:${game}:${query.toLowerCase()}`, () => search(query, game))));

  server.registerTool('get_page', {
    title: 'Read a Wowhead page',
    description: 'Read a Wowhead page as text: tooltip, quick facts, map coordinates, quest text, drop sources with chances, '
      + 'vendors, rewards, abilities, guides and top comments. Guide hubs like https://www.wowhead.com/forever/guides list the guides. '
      + 'Long pages, like patch notes, come in parts that end with the offset of the next part.',
    inputSchema: z.object({
      url: z.string().min(1).max(300).describe('Wowhead URL from search results or the user, like https://www.wowhead.com/forever/item=19019'),
      offset: z.number().int().min(0).default(0).describe('Where to continue a long page, from the end of the previous part'),
    }),
    annotations: hints,
  }, async ({ url, offset }) => text(pagePart(await cached(`page:${url}`, () => readPage(url)), offset)));

  server.registerTool('get_news', {
    title: 'Latest WoW news',
    description: 'The 10 latest Wowhead news posts for a game version, WoW Forever by default, newest first, with dates, URLs '
      + 'and summaries. For retail it also lists this week\'s Mythic+ affixes from Raider.IO.',
    inputSchema: z.object({ game }),
    annotations: hints,
  }, async ({ game }) => text(await cached(`news:${game}`, () => news(game))));

  server.registerTool('character', {
    title: 'Character checkup',
    description: 'Check a retail character on Blizzard\'s official armory and Raider.IO: level, spec, item level and gear, guild, '
      + 'Mythic+ rating and best runs, raid progress. WoW Forever characters are not on the armory yet.',
    inputSchema: z.object({
      region: z.enum(REGIONS).describe('Region of the realm'),
      realm: z.string().min(1).max(60).describe('Realm name, like Tarren Mill'),
      name: z.string().min(1).max(40).describe('Character name'),
    }),
    annotations: hints,
  }, async ({ region, realm, name }) => text(await cached(`character:${region}:${realm}:${name}`.toLowerCase(), () => character(region, realm, name))));

  return server;
});
