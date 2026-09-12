export function canonicalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    // Drop common tracking params
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach(
      (key) => url.searchParams.delete(key),
    );
    // Normalize trailing slash for non-root paths
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return raw.trim();
  }
}

export function normalizePrinciple(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function principlesAreSame(a: string, b: string): boolean {
  return normalizePrinciple(a) === normalizePrinciple(b);
}
