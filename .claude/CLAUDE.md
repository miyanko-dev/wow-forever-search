# wow-forever-search

## Rules

- One public repo is the Claude Code plugin, its marketplace (`source: "./"`), the Agent Skill in `skills/wow-forever-search/` and the MCP server in `src/`, all named `wow-forever-search`.
- `.mcp.json` starts the server with `npx -y github:miyanko-dev/wow-forever-search#vX.Y.Z`, because Claude Code runs no `npm install` for plugins. The tag pins each installed plugin to its own server, so skill and tools never drift and `main` can break without reaching users.
- MCP-only users run `github:miyanko-dev/wow-forever-search#semver:^1`, which follows the newest 1.x tag. A breaking tool change needs a major version and the README updated to the new range.
- WoW Forever only (user, 2026-10-09), so answers never mix in Retail or Classic. Every request goes to `/forever/` paths or the Forever news feed. `get_page` refuses any page without Wowhead's `"dataTree":"Forever"` label, checked after redirects, and comments pass only with `dataTree` 16, the Forever value. Older comments on the same pages are from 2005 to 2020 and describe other mechanics.
- Personal, non-commercial use only. Wowhead's EULA forbids commercial use without written permission, and Anthropic's directory policy wants control over every fetched site, so the plugin is not submitted there (checked 2026-10-09).
- Keep tool output plain text. `get_page` returns long pages in parts of `PAGE_CHARS` through `pagePart`, so no page loses its end.

## Sources

- Add a source only if it allows bots. Check its robots.txt and AI content signals first, identify with the shared User-Agent in `src/http.js`, and never fake a browser or route around a block.
- Checked on 2026-10-07 and left out: Icy Veins (has `/wow-forever/` guides, but Cloudflare blocks every non-browser client), Archon.gg (same), Reddit (robots.txt disallows everything, API access needs approval since 2025-11-11), Warcraft Logs (no WoW Forever logs, API needs an OAuth client), Forever Logs (robots.txt disallows `/api/` and `/reports/`, its API answers "API access not allowed"). Warcraft Wiki was dropped at the user's request.
- Wowhead's robots.txt disallows `/search`, `/list`, `/account` and `/random` for bots. Names are looked up in database listings like `/forever/quests/name:library`, and a test fails if a lookup requests a disallowed path.
- There is no character tool. The retail one (Blizzard armory and Raider.IO) was removed on 2026-10-09. Add a character tool back only once Forever characters exist on the armory, after launch on 2026-11-04. Forever has no realms and two-part names.
- `curl` gets a CloudFront 403 from www.wowhead.com, while Node's `fetch` and Python's `urllib` get through. Probe pages with `node -e`.
- The Wowhead parser depends on these page markers: `g_pageInfo`, `WH.Gatherer.addData`, `WH.markup.printHtml`, `new Listview`, `lv_comments0`, `g_mapperData` and the main column `<div class="text">`. Page data is JSON with some JavaScript fields, which `parseJson` in `src/embedded.js` handles.

## Checks

- `npm test` after every change to `src/`. It reads every source live.
- `claude plugin validate --strict .` checks the marketplace and `claude plugin validate --strict .claude-plugin/plugin.json` the plugin. Fix every warning.
- `npx skills add . --list` confirms that other agents find the skill.
- The Validate workflow runs the plugin and skill checks on every push to `main` and every pull request. It skips `npm test`, because CI addresses may be blocked by the sources.

## Release

1. Bump `version` in `.claude-plugin/plugin.json`, `package.json` and `package-lock.json`, and the tag in `.mcp.json`, to the same value. Installed copies only update when the plugin version changes.
2. Run the checks and fix every warning.
3. Add the changes to `CHANGELOG.md`.
4. Push and wait for the Validate workflow to pass.
5. Tag `vX.Y.Z` and create a GitHub release.
