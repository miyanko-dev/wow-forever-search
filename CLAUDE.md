# wow-forever-mcp

- WoW Forever comes first: tools default to `game: forever`. Other versions stay available because Wowhead serves them through the same prefixes.
- Add a source only if it allows bots. Check its robots.txt and AI content signals first, identify with the shared User-Agent in `src/http.js`, and never fake a browser or route around a block.
- Checked on 2026-10-07 and left out: Icy Veins (has `/wow-forever/` guides, but Cloudflare blocks every non-browser client), Archon.gg (same), Reddit (robots.txt disallows everything, API access needs approval since 2025-11-11), Warcraft Logs (no WoW Forever logs, API needs an OAuth client), Forever Logs (robots.txt disallows `/api/` and `/reports/`, its API answers "API access not allowed"). Warcraft Wiki was dropped at the user's request.
- Wowhead's robots.txt disallows `/search`, `/list`, `/account` and `/random` for bots. Names are looked up in database listings like `/forever/quests/name:library`, and a test fails if a lookup requests a disallowed path.
- Blizzard's armory pages are open to bots and carry the character as `characterProfileInitialState`. Unknown characters answer 500. WoW Forever has no realms and two-part names, so check the URL scheme once Blizzard adds Forever characters.
- `curl` gets a CloudFront 403 from www.wowhead.com, while Node's `fetch` and Python's `urllib` get through. Probe pages with `node -e`.
- The Wowhead parser depends on these page markers: `g_pageInfo`, `WH.Gatherer.addData`, `WH.markup.printHtml`, `new Listview`, `lv_comments0`, `g_mapperData` and the main column `<div class="text">`. Page data is JSON with some JavaScript fields, which `parseJson` in `src/embedded.js` handles.
- Tool output feeds small free models in the Discord bot, so keep it plain text. `get_page` returns long pages in parts of `PAGE_CHARS` through `pagePart`, so no page loses its end.
- Run `npm test` after every change to `src/`. It reads every source live.
