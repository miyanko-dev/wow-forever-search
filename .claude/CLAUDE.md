# wow-forever

## Rules

- One public repo is the Claude Code plugin, its marketplace (`source: "./"`), the Agent Skill in `skills/wow-forever/` and the MCP server in `src/`, all named `wow-forever`.
- `.mcp.json` starts the server with `npx -y github:miyanko-dev/wow-forever`, because Claude Code runs no `npm install` for plugins. npx installs the package from `main`, so `main` must always run.
- WoW Forever comes first: tools default to `game: forever`, and the skill names the version in every answer. Other versions stay available because Wowhead serves them through the same prefixes.
- Personal, non-commercial use only. Wowhead's EULA, Blizzard's website terms and Raider.IO's terms forbid commercial use without written permission, and Anthropic's directory policy wants control over every fetched site, so the plugin is not submitted there (checked 2026-10-09).
- Keep tool output plain text. `get_page` returns long pages in parts of `PAGE_CHARS` through `pagePart`, so no page loses its end.

## Sources

- Add a source only if it allows bots. Check its robots.txt and AI content signals first, identify with the shared User-Agent in `src/http.js`, and never fake a browser or route around a block.
- Checked on 2026-10-07 and left out: Icy Veins (has `/wow-forever/` guides, but Cloudflare blocks every non-browser client), Archon.gg (same), Reddit (robots.txt disallows everything, API access needs approval since 2025-11-11), Warcraft Logs (no WoW Forever logs, API needs an OAuth client), Forever Logs (robots.txt disallows `/api/` and `/reports/`, its API answers "API access not allowed"). Warcraft Wiki was dropped at the user's request.
- Wowhead's robots.txt disallows `/search`, `/list`, `/account` and `/random` for bots. Names are looked up in database listings like `/forever/quests/name:library`, and a test fails if a lookup requests a disallowed path.
- Blizzard's armory pages are open to bots and carry the character as `characterProfileInitialState`. Unknown characters answer 500. WoW Forever has no realms and two-part names, so check the URL scheme once Blizzard adds Forever characters.
- `curl` gets a CloudFront 403 from www.wowhead.com, while Node's `fetch` and Python's `urllib` get through. Probe pages with `node -e`.
- The Wowhead parser depends on these page markers: `g_pageInfo`, `WH.Gatherer.addData`, `WH.markup.printHtml`, `new Listview`, `lv_comments0`, `g_mapperData` and the main column `<div class="text">`. Page data is JSON with some JavaScript fields, which `parseJson` in `src/embedded.js` handles.

## Checks

- `npm test` after every change to `src/`. It reads every source live.
- `claude plugin validate --strict .` checks the marketplace and `claude plugin validate --strict .claude-plugin/plugin.json` the plugin. Fix every warning.
- `npx skills add . --list` confirms that other agents find the skill.
- The Validate workflow runs the plugin and skill checks on every push to `main` and every pull request. It skips `npm test`, because CI addresses may be blocked by the sources.

## Release

1. Bump `version` in `.claude-plugin/plugin.json` and `package.json` together, or installed copies never update.
2. Run the checks and fix every warning.
3. Add the changes to `CHANGELOG.md`.
4. Push and wait for the Validate workflow to pass.
5. Tag `vX.Y.Z` and create a GitHub release.
