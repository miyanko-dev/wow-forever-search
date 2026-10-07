// Pages embed their data as JSON or JavaScript literals inside scripts; these helpers read it.

// Pages assign some data more than once, like `var g_mapperData = {}` before the real value.
export function readVar(html, name) {
  const match = [...html.matchAll(new RegExp(`\\b${name}\\s*=\\s*(?=[[{])`, 'g'))].at(-1);
  return match ? parseJson(balanced(html, match.index + match[0].length)) : undefined;
}

// Matches a whole string first, so keys are only quoted outside strings.
const BARE_KEY = /"(?:[^"\\]|\\.)*"|([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g;

// Page data is mostly JSON, but Wowhead appends some fields as JavaScript, like `firstseenpatch: 0`.
export function parseJson(text) {
  return tryJson(text) ?? tryJson(text.replace(BARE_KEY, (match, before, key, colon) => (key ? `${before}"${key}"${colon}` : match)));
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// The JSON array or object literal that opens at `start`, skipping brackets inside strings.
export function balanced(source, start) {
  const open = source[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'") i = stringEnd(source, i);
    else if (char === open) depth++;
    else if (char === close && --depth === 0) return source.slice(start, i + 1);
  }
  return '';
}

export function stringEnd(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === '\\') i++;
    else if (source[i] === quote) return i;
  }
  return source.length;
}
