import { shouldAlert } from "./detection";
import { RetellCallProvider } from "./providers/retell";
import { TwilioSmsProvider } from "./providers/twilio";
import { getEvents, getSettings, saveEvent, updateEvent } from "./storage";
import type { CallProvider, SmsProvider, UrgeEvent } from "./types";

export interface AlertCoordinatorDeps {
  smsProvider?: SmsProvider;
  callProvider?: CallProvider;
}

export class AlertCoordinator {
  private smsProvider: SmsProvider;
  private callProvider: CallProvider;

  constructor(deps: AlertCoordinatorDeps = {}) {
    this.smsProvider = deps.smsProvider ?? new TwilioSmsProvider();
    this.callProvider = deps.callProvider ?? new RetellCallProvider();
  }

  async handle(event: UrgeEvent): Promise<UrgeEvent> {
    const settings = await getSettings();
    const previousEvents = await getEvents();

    if (!settings.enabled) {
      const skipped = withSkippedAlerts(event, "Swan is disabled");
      await saveEvent(skipped);
      return skipped;
    }

    if (!shouldAlert(event, previousEvents, settings.cooldownMinutes)) {
      const skipped = withSkippedAlerts(event, "cooldown active");
      await saveEvent(skipped);
      return skipped;
    }

    await saveEvent(event);

    const [smsStatus, callStatus] = await Promise.all([
      settings.smsEnabled
        ? this.smsProvider
            .send({ event, settings })
            .then((result) =>
              result.providerId
                ? { state: "success" as const, providerId: result.providerId }
                : { state: "success" as const },
            )
            .catch((error: unknown) => ({
              state: "failed" as const,
              error: error instanceof Error ? error.message : "SMS failed",
            }))
        : Promise.resolve({ state: "skipped" as const, reason: "SMS disabled" }),
      settings.callEnabled
        ? this.callProvider
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
        : Promise.resolve({ state: "skipped" as const, reason: "Call disabled" }),
    ]);

    const updated = { ...event, smsStatus, callStatus };
    await updateEvent(updated);
    return updated;
  }
}

function withSkippedAlerts(event: UrgeEvent, reason: string): UrgeEvent {
  return {
    ...event,
    smsStatus: { state: "skipped", reason },
    callStatus: { state: "skipped", reason },
  };
}
