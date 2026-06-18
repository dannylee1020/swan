import { saveSettings } from "../storage";
import type { AlertContext, AlertStatus, CallProvider } from "../types";
import { ManagedClient } from "../managed/client";
import { hasActiveManagedSubscription } from "../managed/subscription";

export class ManagedCallProvider implements CallProvider {
  constructor(private readonly client?: ManagedClient) {}

  async start({ event, settings }: AlertContext): Promise<AlertStatus> {
    if (!settings.managedAccount) {
      return {
        state: "skipped",
        reason: "Sign in to Swan Managed to place managed calls",
      };
    }
    if (!hasActiveManagedSubscription(settings.managedAccount)) {
      return {
        state: "skipped",
        reason: "Managed calls require a subscription",
      };
    }

    const client = this.client ?? new ManagedClient();
    const result = await client.sendBrowserEvent(
      settings.managedAccount,
      event,
    );

    if (result.account !== settings.managedAccount) {
      await saveSettings({
        ...settings,
        managedAccount: result.account,
      });
    }

    return result.callStatus;
  }
}
