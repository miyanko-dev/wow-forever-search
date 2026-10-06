#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

import pkg from '../package.json' with { type: 'json' };
import { GAMES, getNews, getPage, search } from './wowhead.js';

const CACHE_MS = 60 * 60 * 1000;
const CACHE_SIZE = 300;
const cache = new Map();

const game = z.enum(GAMES).default('retail').describe(
  'Game version: retail is the current game, classic is Classic Era, forever is WoW Forever, '
  + 'tbc, wotlk, cata and mop-classic are the Classic progression versions, ptr, ptr-2 and classic-ptr are test realms',
);
const hints = { readOnlyHint: true, openWorldHint: true };

// Wowhead has no public API, so repeated lookups are answered from memory to keep traffic low.
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

serveStdio(() => {
  const server = new McpServer({ name: 'wowhead', version: pkg.version });

  server.registerTool('search', {
    title: 'Search Wowhead',
    description: 'Search Wowhead by name for items, spells, quests, NPCs, zones, objects, achievements, '
      + 'guides and news. Returns up to 10 matches with their Wowhead URLs. Open a match with get_page for details.',
    inputSchema: z.object({ query: z.string().min(1).max(100).describe('Name or keywords, in English'), game }),
    annotations: hints,
  }, async ({ query, game }) => text(await cached(`search:${game}:${query.toLowerCase()}`, () => search(query, game))));

  server.registerTool('get_page', {
    title: 'Read a Wowhead page',
    description: 'Read a Wowhead page as text: tooltip, quick facts, map coordinates, quest text, related lists '
      + '(drop sources with chances, vendors, quest rewards, drops), the article or guide, and top comments.',
    inputSchema: z.object({
      url: z.string().min(1).max(300).describe('Wowhead URL from search results or the user, like https://www.wowhead.com/classic/item=19019'),
    }),
    annotations: hints,
  }, async ({ url }) => text(await cached(`page:${url}`, () => getPage(url))));

  server.registerTool('get_news', {
    title: 'Latest Wowhead news',
    description: 'The 10 latest Wowhead news posts for a game version, newest first, with dates, URLs and summaries.',
    inputSchema: z.object({ game }),
    annotations: hints,
  }, async ({ game }) => text(await cached(`news:${game}`, () => getNews(game))));

  return server;
});
