import { shouldAlert } from "./detection";
import { ElevenLabsCallProvider } from "./providers/elevenlabs";
import { getEvents, getSettings, saveEvent, updateEvent } from "./storage";
import type { CallProvider, UrgeEvent, UserSettings } from "./types";

export interface AlertCoordinatorDeps {
  callProvider?: CallProvider;
}

export interface StartedAlert {
  event: UrgeEvent;
  completion: Promise<UrgeEvent>;
}

export class AlertCoordinator {
  private callProvider: CallProvider;

  constructor(deps: AlertCoordinatorDeps = {}) {
    this.callProvider = deps.callProvider ?? new ElevenLabsCallProvider();
  }

  async handle(event: UrgeEvent): Promise<UrgeEvent> {
    const started = await this.start(event);
    return started.completion;
  }

  async start(event: UrgeEvent): Promise<StartedAlert> {
    const settings = await getSettings();
    const previousEvents = await getEvents();

    if (!settings.enabled) {
      const skipped = withSkippedAlerts(event, "Swan is disabled");
      await saveEvent(skipped);
      return { event: skipped, completion: Promise.resolve(skipped) };
    }

    if (!shouldAlert(event, previousEvents, settings.cooldownMinutes)) {
      const skipped = withSkippedAlerts(event, "cooldown active");
      await saveEvent(skipped);
      return { event: skipped, completion: Promise.resolve(skipped) };
    }

    await saveEvent(event);

    return {
      event,
      completion: this.complete(event, settings),
    };
  }

  private async complete(event: UrgeEvent, settings: UserSettings): Promise<UrgeEvent> {
    const callStatus = settings.callEnabled
      ? await this.callProvider
          .start({ event, settings })
          .then((result) =>
            result.providerId
              ? { state: "success" as const, providerId: result.providerId }
              : { state: "success" as const },
          )
          .catch((error: unknown) => ({
            state: "failed" as const,
            error: error instanceof Error ? error.message : "Call failed",
          }))
      : { state: "skipped" as const, reason: "Call disabled" };

    const updated = { ...event, callStatus };
    await updateEvent(updated);
    return updated;
  }
}

function withSkippedAlerts(event: UrgeEvent, reason: string): UrgeEvent {
  return {
    ...event,
    callStatus: { state: "skipped", reason },
  };
}
