# wowhead-mcp

MCP server that looks up World of Warcraft data on Wowhead for every game version: items, spells, quests, NPCs, zones, guides and news.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `search` | `query`, `game` | Up to 10 matches with type, Wowhead URL and a one-line summary |
| `get_page` | `url` | The page as text: tooltip, quick facts, map coordinates, quest text, related lists like drop sources with chances, the article or guide, and top comments |
| `get_news` | `game` | The 10 latest news posts with date, URL and summary |

`game` is one of these, `retail` by default:

| Value | Game |
|---|---|
| `retail` | The current game |
| `classic` | Classic Era |
| `forever` | WoW Forever |
| `tbc`, `wotlk`, `cata`, `mop-classic` | Classic progression versions |
| `ptr`, `ptr-2`, `classic-ptr` | Test realms |

## Use it

Requires Node 22 or later.

Add it to Claude Code:

```sh
claude mcp add wowhead -- npx -y github:miyanko-dev/wowhead-mcp
```

Add it to any other MCP host, such as Claude Desktop:

```json
{
  "mcpServers": {
    "wowhead": { "command": "npx", "args": ["-y", "github:miyanko-dev/wowhead-mcp"] }
  }
}
```

Try it from a checkout in the MCP Inspector:

```sh
npm install
npx @modelcontextprotocol/inspector node src/index.js
```

## How it reads Wowhead

Wowhead has no public API, so the server reads what the site itself loads:

| Data | Source |
|---|---|
| Search | `www.wowhead.com/<game>/search/suggestions-template?q=` |
| Pages | The page HTML and the data embedded in its scripts |
| Tooltips | `nether.wowhead.com/<game>/tooltip/<type>/<id>` |
| News | `www.wowhead.com/news/rss/<feed>` |

To keep traffic low and honest, it caches every answer for an hour, names this repo in its User-Agent and fetches nothing but wowhead.com.

## Test

```sh
npm test
```

The tests read wowhead.com live, so a failure usually means a page layout changed.
