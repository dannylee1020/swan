import { AlertCoordinator } from "../lib/alerts";
import { createUrgeEvent, findMatchingRule } from "../lib/detection";
import type { SwanMessage, SwanMessageResponse } from "../lib/messages";
import { getEvents, getRules } from "../lib/storage";

const coordinator = new AlertCoordinator();

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void getRules();
  });

  chrome.action.onClicked.addListener(() => {
    void chrome.runtime.openOptionsPage();
  });

  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0 || !details.url.startsWith("http")) return;

    void handleNavigation(details.url, details.tabId);
  });

  chrome.runtime.onMessage.addListener(
    (
      message: SwanMessage,
      _sender,
      sendResponse: (response: SwanMessageResponse) => void,
    ) => {
      if (message.type === "SWAN_TEST_ALERT") {
        void createTestAlert().then(sendResponse);
        return true;
      }

      if (message.type === "SWAN_GET_EVENT") {
        void getEvent(message.eventId).then(sendResponse);
        return true;
      }

      return false;
    },
  );
});

async function handleNavigation(url: string, tabId: number): Promise<void> {
  const match = findMatchingRule(url, await getRules());
  if (!match) return;

  const event = createUrgeEvent(match.domain, match.rule.id);
  await coordinator.handle(event);

  await chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`/intervention.html?eventId=${event.id}`),
  });
}

async function createTestAlert(): Promise<SwanMessageResponse> {
  try {
    const event = createUrgeEvent("test.swan.local", "test:manual");
    const updated = await coordinator.handle(event);
    return { ok: true, event: updated };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Test alert failed",
    };
  }
}

async function getEvent(eventId: string): Promise<SwanMessageResponse> {
  const event = (await getEvents()).find((candidate) => candidate.id === eventId);
  if (!event) return { ok: false, error: "Event not found" };
  return { ok: true, event };
}
