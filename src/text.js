// Wowhead ships content as HTML and as its own BBCode-like markup; both become plain text here.

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Markup tags that link an entity by id, like [item=19019], which pages render with the entity's name.
const ENTITY_TAGS = new Set([
  'npc', 'object', 'item', 'itemset', 'item-set', 'quest', 'spell', 'zone', 'faction', 'achievement',
  'currency', 'event', 'skill', 'class', 'race', 'title', 'pet', 'mount', 'guide', 'building',
]);

export function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] !== '#') return NAMED_ENTITIES[code.toLowerCase()] ?? match;
    const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return point <= 0x10ffff ? String.fromCodePoint(point) : match;
  });
}

export function htmlToText(html) {
  return tidy(decodeEntities(html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '')

    // A page slice can end inside a script block.
    .replace(/<script\b[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')

    // Coins are icons on the page, so their unit only exists in the class name.
    .replace(/<span class="money(gold|silver|copper)">([^<]*)<\/span>/g, (match, coin, amount) => `${amount}${coin[0]}`)
    .replace(/<h\d\b[^>]*>/gi, '\n\n## ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/?(p|div|tr|table|ul|ol)\b[^>]*>|<\/h\d>/gi, '\n')
    .replace(/<(td|th)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')));
}

// `names` maps "item=19019" to the entity's name, taken from the page's Gatherer data.
export function markupToText(markup, names = new Map()) {
  return tidy(decodeEntities(markup

    // Hover popups and images carry no readable text.
    .replace(/\[(tooltip|screenshot|img)\b[^\]]*\][\s\S]*?\[\/\1\]/g, '')
    .replace(/\[([a-z][\w-]*)=(\d+)\b[^\]]*\]/g, (match, tag, id) => {
      if (!ENTITY_TAGS.has(tag)) return match;
      const type = tag === 'itemset' ? 'item-set' : tag;
      return names.get(`${type}=${id}`) ?? `${type} ${id}`;
    })
    .replace(/\[money=(\d+)\]/g, (match, copper) => formatMoney(Number(copper)))
    .replace(/\[h\d\b[^\]]*\]/g, '\n\n## ')
    .replace(/\[li\b[^\]]*\]/g, '\n- ')
    .replace(/\[(br|hr)\]/g, '\n')
    .replace(/\[\/(h\d|ul|ol|tr|table|p|div|center|minibox)\]/g, '\n')
    .replace(/\[td\b[^\]]*\]/g, ' ')

    // Wowhead tags are lowercase, so bracketed names like [Bindings of the Windseeker] survive.
    .replace(/\[\/?[a-z][\w-]*(?:[ =][^\]]*)?\]/g, '')));
}

export function formatMoney(copper) {
  const parts = [[Math.floor(copper / 10000), 'g'], [Math.floor(copper / 100) % 100, 's'], [copper % 100, 'c']];
  return parts.filter(([amount]) => amount).map(([amount, unit]) => `${amount}${unit}`).join(' ') || '0c';
}

export function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()} [truncated]`;
}

export function section(heading, body) {
  return body ? `## ${heading}\n${body}` : '';
}

function tidy(text) {
  return text
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/^-$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
