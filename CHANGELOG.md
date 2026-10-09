# Changelog

## 2.0.0 (2026-10-09)

- WoW Forever only. `get_page` refuses pages Wowhead labels as another version, also behind a redirect, and comments come only from WoW Forever instead of 2005 to 2020.
- Removed the `game` input from every tool and the retail `character` tool with its Blizzard armory and Raider.IO sources.
- MCP-only setups move to `#semver:^2`. Setups on `^1` keep 1.1.0.

## 1.1.0 (2026-10-09)

- Renamed to `wow-forever-search`: repo, plugin, marketplace, skill, MCP server and package. Reinstall with `/plugin marketplace add miyanko-dev/wow-forever-search`. MCP-only setups keep working through GitHub's redirect, and the README has the new name.

## 1.0.1 (2026-10-09)

- The plugin runs the server from its own release tag instead of `main`, so skill and tools always match.
- MCP-only setups follow the newest 1.x release with `#semver:^1`.

## 1.0.0 (2026-10-09)

- First release as one plugin. Brings the WoW Forever MCP server, formerly `wow-forever-mcp` 3.1.0, and the skill, formerly the `wow-research` plugin, together in one repo.
- Reads long Wowhead pages in parts, keeps old and new values in patch notes and sums up class changes per class.
