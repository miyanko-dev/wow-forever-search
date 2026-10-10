# Changelog

## 1.1.0 (2026-10-10)

- `src/server.js` exports `createServer()`, so other hosts such as a Cloudflare Worker can run the same tools over an in-memory transport. The stdio server is unchanged.

## 1.0.0 (2026-10-09)

- First release. A Claude Code plugin with a bundled MCP server and skill that search WoW Forever on Wowhead: items, drops, quests, NPCs, spells, guides, news and patch notes.
- Reads WoW Forever only: pages and comments Wowhead labels as another version are left out.
- Reads long pages in parts, keeps old and new values in patch notes and sums up class changes per class.
