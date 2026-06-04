import { normalizeDomain, domainMatchesRule } from "./domain";
import type { DetectionRule, UrgeEvent } from "./types";

export function findMatchingRule(
  url: string,
  rules: DetectionRule[],
): { domain: string; rule: DetectionRule } | null {
  const domain = normalizeDomain(url);
  if (!domain) return null;

  const rule = rules.find(
    (candidate) =>
      candidate.enabled && domainMatchesRule(domain, candidate.domain),
  );

  return rule ? { domain, rule } : null;
}

export function shouldAlert(
  event: Pick<UrgeEvent, "domain" | "timestamp">,
  previousEvents: UrgeEvent[],
  cooldownMinutes: number,
): boolean {
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const eventTime = Date.parse(event.timestamp);

  return !previousEvents.some((previous) => {
    if (previous.domain !== event.domain) return false;
    const previousTime = Date.parse(previous.timestamp);
    return eventTime - previousTime >= 0 && eventTime - previousTime < cooldownMs;
  });
}

export function createUrgeEvent(domain: string, ruleId: string): UrgeEvent {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    timestamp: new Date().toISOString(),
    domain,
    ruleId,
    trigger: "navigation",
    callStatus: { state: "pending" },
  };
}
