import { describe, expect, it } from "vitest";

import { getManagedApiExternallyConnectableMatches } from "../wxt.config";

describe("WXT manifest config", () => {
  it("allows local Stripe return pages when the dev server binds 0.0.0.0", () => {
    expect(
      getManagedApiExternallyConnectableMatches("http://0.0.0.0:8000"),
    ).toEqual([
      "http://127.0.0.1/*",
      "http://localhost/*",
      "http://0.0.0.0/*",
    ]);
  });

  it("keeps production external messaging scoped to the managed API origin", () => {
    expect(
      getManagedApiExternallyConnectableMatches("https://api.swan.test"),
    ).toEqual(["https://api.swan.test/*"]);
  });
});
