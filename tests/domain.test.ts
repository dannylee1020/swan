import { describe, expect, it } from "vitest";
import { domainMatchesRule, normalizeDomain } from "../lib/domain";

describe("domain helpers", () => {
  it("normalizes URLs and hostnames without storing paths", () => {
    expect(normalizeDomain("https://www.example.com/private?q=1")).toBe(
      "example.com",
    );
    expect(normalizeDomain("Sub.Example.com/path")).toBe("sub.example.com");
  });

  it("matches exact domains and subdomains", () => {
    expect(domainMatchesRule("example.com", "example.com")).toBe(true);
    expect(domainMatchesRule("media.example.com", "example.com")).toBe(true);
    expect(domainMatchesRule("badexample.com", "example.com")).toBe(false);
  });
});
