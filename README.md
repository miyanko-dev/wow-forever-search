# wow-info-mcp

MCP server for World of Warcraft information from Wowhead, Warcraft Wiki and Raider.IO, for every game version: items, NPCs, quests, drop chances, lore, mechanics, news, Mythic+ affixes and characters.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `search` | `query`, `game` | Warcraft Wiki articles with their Wowhead links, and Wowhead items, NPCs and quests whose names match |
| `get_page` | `url` | A Wowhead page or a Warcraft Wiki article as text. Wowhead pages give the tooltip, quick facts, map coordinates, quest text, drop sources with chances, vendors, guides and top comments |
| `get_news` | `game` | The 10 latest Wowhead news posts, plus this week's Mythic+ affixes for retail |
| `character` | `region`, `realm`, `name` | A retail character's item level, Mythic+ score and best runs, raid progression and guild |

`game` is one of these, `retail` by default:

| Value | Game |
|---|---|
| `retail` | The current game |
| `classic` | Classic Era |
| `forever` | WoW Forever |
| `tbc`, `wotlk`, `cata`, `mop-classic` | Classic progression versions |
| `ptr`, `ptr-2`, `classic-ptr` | Test realms |

## Sources

| Source | Used for | Read through |
|---|---|---|
| [Wowhead](https://www.wowhead.com) | Game database, guides, news | Pages, database listings, the tooltip API and RSS feeds |
| [Warcraft Wiki](https://warcraft.wiki.gg) | Lore, mechanics, search | The MediaWiki API |
| [Raider.IO](https://raider.io) | Characters, Mythic+ affixes | The public API |

Every source is read the way it allows bots. The server follows each robots.txt and its AI content signals, names this repo in its User-Agent, caches answers for an hour and fetches nothing outside these hosts. Warcraft Wiki allows AI use for reference only, so answers built on it should cite and link instead of reproducing articles.

## Use it

Requires Node 22 or later.

Add it to Claude Code:

```sh
claude mcp add wow-info -- npx -y github:miyanko-dev/wow-info-mcp
```

Add it to any other MCP host, such as Claude Desktop:

```json
{
  "mcpServers": {
    "wow-info": { "command": "npx", "args": ["-y", "github:miyanko-dev/wow-info-mcp"] }
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
