import type { DetectionRule, UserSettings } from "./types";

const now = "2026-05-20T00:00:00.000Z";

export const seedRules: DetectionRule[] = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "xhamster.com",
  "spankbang.com",
  "tube8.com",
  "brazzers.com",
  "onlyfans.com",
].map((domain) => ({
  id: `seed:${domain}`,
  domain,
  enabled: true,
  source: "seed",
  createdAt: now,
}));

export const defaultSettings: UserSettings = {
  enabled: true,
  deliveryMode: "byok",
  phoneNumber: "",
  callEnabled: true,
  elevenLabs: {
    apiKey: "",
    agentId: "",
    agentPhoneNumberId: "",
  },
  managedAccount: null,
};
