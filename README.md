# wow-forever-mcp

MCP server for World of Warcraft information, focused on WoW Forever: items, NPCs, quests, spells, drop chances, coordinates, guides and news from Wowhead, plus character checkups from Blizzard's official armory and Raider.IO.

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

Every source is read the way it allows bots. The server follows each robots.txt and its AI content signals, names this repo in its User-Agent, caches answers for an hour and fetches nothing outside these hosts.

WoW Forever characters are not on Blizzard's armory yet, so `character` covers retail until Blizzard adds them. Left out as of 2026-10-07: Icy Veins, whose Cloudflare blocks every bot, Warcraft Logs, which has no WoW Forever logs, and Forever Logs, whose robots.txt disallows its API.

## Use it

Requires Node 22 or later.

Add it to Claude Code:

```sh
claude mcp add wow-forever -- npx -y github:miyanko-dev/wow-forever-mcp
```

Add it to any other MCP host, such as Claude Desktop:

```json
{
  "mcpServers": {
    "wow-forever": { "command": "npx", "args": ["-y", "github:miyanko-dev/wow-forever-mcp"] }
  }
}
```

Try it from a checkout in the MCP Inspector:

```sh
npm install
npx @modelcontextprotocol/inspector node src/index.js
```

## Test

```sh
npm test
```

The tests read every source live, so a failure usually means a page layout or API changed.
