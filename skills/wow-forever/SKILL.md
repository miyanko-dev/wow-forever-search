---
name: wow-forever
description: "answer any question about wow forever, and other world of warcraft versions when named, through the wow-forever mcp tools (search, get_page, get_news, character). use for items, drops, quests, npcs, spells, talents, classes, professions, guides, news, patch notes, beta builds and class changes, retail character checkups, and whenever a wowhead link appears. looks everything up instead of answering from memory, and turns long patch notes into short per-class overviews with before and after values and source links."
---

# WoW Forever

Answer questions about WoW Forever, or another World of Warcraft version when the user names one, from the wow-forever MCP tools. Look everything up, never answer stats, drop chances, coordinates, quest steps or numbers from memory.

## Version

- Use `game: forever` unless the user names another version, like retail, classic or mop-classic.
- Name the version in the first line of every answer, like "WoW Forever beta:", so a wrong guess shows at once.

## Find the source

| The user gives | Do |
|---|---|
| A Wowhead URL | `get_page` on it |
| Recent changes, a patch, a beta build | `get_news`, then `get_page` on the matching post |
| An item, quest, NPC or spell name | `search` with the English name, then `get_page` on the best match |
| A topic without a name | `get_page` on the guide hub, like `https://www.wowhead.com/forever/guides` |
| A retail character | `character` with region, realm and name |

## Read all of it

Long pages come in parts. A part that ends with `[Part ends at N ... offset N ...]` has more: call `get_page` again with that `offset` until a part has no such line. Never summarize patch notes from the first part only.

Reading patch notes:

- `52 (was 38)` is a change from 38 to 52. `(new: ...)` is added text, `(removed: ...)` is removed text.
- `## Hunter`, `## Survival` and similar headings name the class and the talent tree or spell group.
- A spell listed several times is one entry per rank. Report the change across ranks, like `7/12/18 → 5/8/12`.
- Lines like `Effect #1 Apply Aura`, `Mod Resistance → Effect Aura #674`, `ProcChance changed` or `Category changed` are internal data. When the tooltip numbers stay the same, call it "no visible change".
- Wording that only changes "The hunter takes" to "You take" is "wording only".

## Answer

- First line is the answer, with the version.
- Patch notes and class changes: one `##` section per class or topic the user asked for, each a table with the columns Change, Before → after and Effect. Effect is buff, nerf, no visible change or wording only, plus a few words on why it matters.
- Order rows by impact, biggest first. Put internal-only changes in one closing row or sentence.
- Give percentages where they help, like "about 33% less".
- Link the Wowhead pages you used.
- If the sources don't have the answer, say so plainly.
