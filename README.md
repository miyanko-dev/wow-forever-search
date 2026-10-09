# WoW Forever Search

Lets Claude answer anything about WoW Forever: items, drops, quests, NPCs, spells, talents, guides, news and patch notes. A bundled MCP server reads Wowhead's WoW Forever data in full, and a skill turns what it finds into short answers with sources.

## What it does

- Looks every fact up on Wowhead instead of answering from memory: stats, drop chances, coordinates, quest steps.
- Sums up patch notes and beta builds per class, with before and after values and whether each change is a buff, a nerf or internal only.
- Reads long pages, like full patch notes, in parts, so nothing gets cut off.
- Reads WoW Forever only. Pages of Retail, Classic and other versions are refused, and comments written for older versions are left out, so no answer mixes in other mechanics.

## Install

Requires Node 22 or later and git.

### Claude Code

Works in the terminal, the Code tab of the Claude desktop app and the IDE extensions.

```
/plugin marketplace add miyanko-dev/wow-forever-search
/plugin install wow-forever-search@wow-forever-search
```

### Claude app

In Chat or Cowork, open Customize, Plugins, Add, Add marketplace, and enter `miyanko-dev/wow-forever-search`. Cowork sessions on your computer run the MCP server. Chat loads only the skill, so add the server there in Settings, Developer, Edit Config:

```json
{
  "mcpServers": {
    "wow-forever-search": { "command": "npx", "args": ["-y", "github:miyanko-dev/wow-forever-search#semver:^1"] }
  }
}
```

Restart the app afterwards.

### Codex

Works in the Codex CLI and in Codex in the ChatGPT desktop app, which reads the same marketplace. Start a new session afterwards.

```sh
codex plugin marketplace add miyanko-dev/wow-forever-search
codex plugin add wow-forever-search@wow-forever-search
```

### Other agents

The MCP server runs in any MCP host with `npx -y github:miyanko-dev/wow-forever-search#semver:^1`, which always runs the newest 1.x release. The skill alone installs with `npx skills add miyanko-dev/wow-forever-search`.

## Usage

```
/wow-forever-search <question or Wowhead link>
```

Examples:

- `/wow-forever-search paladin, hunter, priest and rogue changes in the latest beta build`
- `/wow-forever-search where does Thunderfury drop?`
- `/wow-forever-search best leveling guide for a holy priest`

It also triggers on its own for WoW Forever questions and Wowhead links.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `search` | `query` | WoW Forever items, NPCs, quests and spells whose names match, with their Wowhead URLs |
| `get_page` | `url`, `offset` | A WoW Forever page as text: tooltip, quick facts, map coordinates, quest text, drop sources with chances, vendors, abilities, guides and top WoW Forever comments. Long pages come in parts, each naming the `offset` of the next |
| `get_news` | none | The 10 latest WoW Forever news posts on Wowhead |

## Source

Everything comes from [Wowhead's WoW Forever section](https://www.wowhead.com/forever): its database pages, database listings, tooltips, guides and news feed. Wowhead labels every page and comment with its game version, and the server keeps only what is labeled WoW Forever, checked after redirects.

The server follows Wowhead's robots.txt, names this repo in its User-Agent, caches answers for an hour and fetches nothing outside Wowhead. It is for personal, non-commercial use. The data belongs to Wowhead, and its terms apply.

## Develop

```sh
npm install
npm test
```

The tests read every source live, so a failure usually means a page layout or API changed. Try the server in the MCP Inspector with `npx @modelcontextprotocol/inspector node src/index.js`, and the plugin with `claude --plugin-dir .`.

World of Warcraft is a trademark of Blizzard Entertainment. This project is not affiliated with Blizzard or Wowhead.
