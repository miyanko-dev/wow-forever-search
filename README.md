# WoW Forever

Lets Claude answer anything about WoW Forever: items, drops, quests, NPCs, spells, talents, guides, news and patch notes. A bundled MCP server reads Wowhead in full, and a skill turns what it finds into short answers with sources. Other World of Warcraft versions work when you name them.

## What it does

- Looks every fact up on Wowhead instead of answering from memory: stats, drop chances, coordinates, quest steps.
- Sums up patch notes and beta builds per class, with before and after values and whether each change is a buff, a nerf or internal only.
- Reads long pages, like full patch notes, in parts, so nothing gets cut off.
- Checks retail characters on Blizzard's armory and Raider.IO.
- Names the game version in every answer, WoW Forever unless you ask for another.

## Install

Requires Node 22 or later and git.

### Claude Code

Works in the terminal, the Code tab of the Claude desktop app and the IDE extensions.

```
/plugin marketplace add miyanko-dev/wow-forever
/plugin install wow-forever@wow-forever
```

### Claude app

In Chat or Cowork, open Customize, Plugins, Add, Add marketplace, and enter `miyanko-dev/wow-forever`. Cowork sessions on your computer run the MCP server. Chat loads only the skill, so add the server there in Settings, Developer, Edit Config:

```json
{
  "mcpServers": {
    "wow-forever": { "command": "npx", "args": ["-y", "github:miyanko-dev/wow-forever"] }
  }
}
```

Restart the app afterwards.

### Codex

Works in the Codex CLI and in Codex in the ChatGPT desktop app, which reads the same marketplace. Start a new session afterwards.

```sh
codex plugin marketplace add miyanko-dev/wow-forever
codex plugin add wow-forever@wow-forever
```

### Other agents

The MCP server runs in any MCP host with `npx -y github:miyanko-dev/wow-forever`. The skill alone installs with `npx skills add miyanko-dev/wow-forever`.

## Usage

```
/wow-forever <question or Wowhead link>
```

Examples:

- `/wow-forever paladin, hunter, priest and rogue changes in the latest beta build`
- `/wow-forever where does Thunderfury drop?`
- `/wow-forever how do I start the Onyxia attunement in classic?`

It also triggers on its own for WoW questions and Wowhead links.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `search` | `query`, `game` | Wowhead items, NPCs, quests and spells whose names match, with their URLs |
| `get_page` | `url`, `offset` | A Wowhead page as text: tooltip, quick facts, map coordinates, quest text, drop sources with chances, vendors, abilities, guides and top comments. Long pages come in parts, each naming the `offset` of the next |
| `get_news` | `game` | The 10 latest Wowhead news posts, plus this week's Mythic+ affixes for retail |
| `character` | `region`, `realm`, `name` | A retail character from the official armory (level, spec, item level, gear, guild, Mythic+ rating) and Raider.IO (Mythic+ score, best runs, raid progress) |

`game` is one of these, `forever` by default:

| Value | Game |
|---|---|
| `forever` | WoW Forever |
| `retail` | The current game |
| `classic` | Classic Era |
| `tbc`, `wotlk`, `cata`, `mop-classic` | Classic progression versions |
| `ptr`, `ptr-2`, `classic-ptr` | Test realms |

## Sources

| Source | Used for | Read through |
|---|---|---|
| [Wowhead](https://www.wowhead.com/forever) | Database, guides and news for WoW Forever and every other version | Pages, database listings, the tooltip API and RSS feeds |
| [Blizzard armory](https://worldofwarcraft.blizzard.com) | Official character profiles | The public armory pages |
| [Raider.IO](https://raider.io) | Mythic+ runs, raid progress, weekly affixes | The public API |

The server follows each site's robots.txt, names this repo in its User-Agent, caches answers for an hour and fetches nothing outside these hosts. It is for personal, non-commercial use. The data belongs to Wowhead, Blizzard and Raider.IO, and their terms apply.

WoW Forever characters are not on Blizzard's armory yet, so `character` covers retail until Blizzard adds them.

## Develop

```sh
npm install
npm test
```

The tests read every source live, so a failure usually means a page layout or API changed. Try the server in the MCP Inspector with `npx @modelcontextprotocol/inspector node src/index.js`, and the plugin with `claude --plugin-dir .`.

World of Warcraft is a trademark of Blizzard Entertainment. This project is not affiliated with Blizzard, Wowhead or Raider.IO.
