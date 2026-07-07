// Guards for DB-derived URLs. The magazine-hub DB is populated from scraped
// external sites, so link/cover URLs are untrusted input.

/** Returns the URL only if it parses as http(s); otherwise undefined. */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // Site-relative paths (e.g. /api/images/...) are produced by our own
    // resolvers and are safe to keep.
    if (url.startsWith("/") && !url.startsWith("//")) return url;
  }
  return undefined;
}

/** Escapes a URL for interpolation inside CSS url("..."). */
export function cssBgUrl(url: string): string {
  const escaped = url
    .replace(/\\/g, "%5C")
    .replace(/"/g, "%22")
    .replace(/\)/g, "%29")
    .replace(/\s/g, "%20");
  return `url("${escaped}")`;
}
