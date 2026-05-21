import type { UrgeEvent } from "./types";

export type SwanMessage =
  | { type: "SWAN_TEST_ALERT" }
  | { type: "SWAN_GET_EVENT"; eventId: string };

export type SwanMessageResponse =
  | { ok: true; event?: UrgeEvent }
  | { ok: false; error: string };
