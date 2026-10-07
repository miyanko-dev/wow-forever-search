# wow-info-mcp

- Add a source only if it allows bots. Check its robots.txt and AI content signals first, identify with the shared User-Agent in `src/http.js`, and never fake a browser or route around a block.
- Checked on 2026-10-07 and left out: Reddit (robots.txt disallows everything, and API access needs Reddit's approval since 2025-11-11), Icy Veins and Archon.gg (Cloudflare blocks every non-browser client).
- Wowhead's robots.txt disallows `/search`, `/list`, `/account` and `/random` for bots. Names are looked up in database listings like `/forever/quests/name:library`, and a test fails if a lookup requests a disallowed path.
- Warcraft Wiki signals `ai-train=no, use=reference`. Tool output may feed answers, but answers cite and link instead of reproducing articles.
- `curl` gets a CloudFront 403 from www.wowhead.com, while Node's `fetch` and Python's `urllib` get through. Probe pages with `node -e`.
- The Wowhead parser depends on these page markers: `g_pageInfo`, `WH.Gatherer.addData`, `WH.markup.printHtml`, `new Listview`, `lv_comments0`, `g_mapperData` and the main column `<div class="text">`. Page data is JSON with some JavaScript fields, which `parseJson` handles.
- Game versions are URL prefixes on both Wowhead hosts, for example `/forever/item=19019` and `nether.wowhead.com/forever/tooltip/item/19019`. A new version only needs its prefix in `GAMES`.
- Tool output feeds small free models in the Discord bot, so keep it plain text and under `PAGE_CHARS`.
- Run `npm test` after every change to `src/`. It reads every source live.
