const USER_AGENT = 'wow-forever-mcp (+https://github.com/miyanko-dev/wow-forever-mcp)';

// Every source sees who is asking, so a site owner can reach us instead of blocking blindly.
export async function request(url) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const detail = await response.json().then((body) => body.message ?? body.error?.info ?? '', () => '');
    throw new Error(`${new URL(url).hostname} answered ${response.status}${detail ? ` (${detail})` : ''} for ${url}`);
  }
  return response;
}
