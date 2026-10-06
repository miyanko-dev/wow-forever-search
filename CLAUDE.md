# wowhead-mcp

- `curl` gets a CloudFront 403 from www.wowhead.com, while Node's `fetch` and Python's `urllib` get through. Probe pages with `node -e`.
- The parser depends on these page markers: `g_pageInfo`, `WH.Gatherer.addData`, `WH.markup.printHtml`, `new Listview`, `lv_comments0`, `g_mapperData` and the main column `<div class="text">`. Check them first when a section comes back empty.
- Game versions are URL prefixes on both hosts, for example `/forever/item=19019` and `nether.wowhead.com/forever/tooltip/item/19019`. A new version only needs its prefix in `GAMES`.
- Tool output feeds small free models in the Discord bot, so keep it plain text and under `PAGE_CHARS`.
- Run `npm test` after every change to `src/`. It reads wowhead.com live.
