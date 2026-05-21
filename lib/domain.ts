export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.replace(/^www\./, "");
    if (!hostname || hostname.includes("..")) return null;
    return hostname;
  } catch {
    const fallback = trimmed
      .replace(/^www\./, "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0];

    if (!fallback || fallback.includes("..")) return null;
    return fallback;
  }
}

export function domainMatchesRule(domain: string, ruleDomain: string): boolean {
  return domain === ruleDomain || domain.endsWith(`.${ruleDomain}`);
}
