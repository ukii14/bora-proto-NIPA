/**
 * 외부 링크 href용. http(s)만 허용해 javascript:/data: 등 XSS 완화.
 */
export function getSafeExternalHref(url) {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.href;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
