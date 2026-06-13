import { describe, expect, it } from "vitest";

import { formatPhoneNumberE164 } from "../lib/phone";

describe("phone number formatting", () => {
  it("formats 10-digit US phone numbers as E.164", () => {
    expect(formatPhoneNumberE164("7144342839")).toBe("+17144342839");
  });

  it("keeps formatted numbers normalized", () => {
    expect(formatPhoneNumberE164("+1 (714) 434-2839")).toBe("+17144342839");
  });

  it("formats US numbers with a leading country code", () => {
    expect(formatPhoneNumberE164("17144342839")).toBe("+17144342839");
  });
});
