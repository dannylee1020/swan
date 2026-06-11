import { ElevenLabsCallProvider } from "./providers/elevenlabs";
import { ManagedCallProvider } from "./providers/managed";
import { getSettings, saveEvent, updateEvent } from "./storage";
import type { CallProvider, UrgeEvent, UserSettings } from "./types";

export interface AlertCoordinatorDeps {
  callProvider?: CallProvider;
  managedCallProvider?: CallProvider;
}

export interface StartedAlert {
  event: UrgeEvent;
  completion: Promise<UrgeEvent>;
}

export class AlertCoordinator {
  private callProvider: CallProvider;
  private managedCallProvider: CallProvider;

  constructor(deps: AlertCoordinatorDeps = {}) {
    this.callProvider = deps.callProvider ?? new ElevenLabsCallProvider();
    this.managedCallProvider =
      deps.managedCallProvider ?? new ManagedCallProvider();
  }

  async handle(event: UrgeEvent): Promise<UrgeEvent> {
    const started = await this.start(event);
    return started.completion;
  }

  async start(event: UrgeEvent): Promise<StartedAlert> {
    const settings = await getSettings();

    if (!settings.enabled) {
      const skipped = withSkippedAlerts(event, "Swan is disabled");
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
    const provider =
      settings.deliveryMode === "managed"
        ? this.managedCallProvider
        : this.callProvider;
    const callStatus = settings.callEnabled
      ? await provider
          .start({ event, settings })
          .catch((error: unknown) => ({
            state: "failed" as const,
            error:
              error instanceof Error
                ? error.message
                : settings.deliveryMode === "managed"
                  ? "Managed call failed"
                  : "Call failed",
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
