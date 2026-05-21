import type { AlertContext, CallProvider, ProviderResult } from "../types";

export class RetellCallProvider implements CallProvider {
  async start({ event, settings }: AlertContext): Promise<ProviderResult> {
    const { apiKey, agentId, fromNumber } = settings.retell;
    if (!settings.phoneNumber || !apiKey || !agentId || !fromNumber) {
      throw new Error("Retell call is not configured");
    }

    const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: settings.phoneNumber,
        override_agent_id: agentId,
        retell_llm_dynamic_variables: {
          swan_event_id: event.id,
          swan_detected_domain: event.domain,
          swan_detected_at: event.timestamp,
        },
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      call_id?: string;
      message?: string;
      error_message?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.error_message ??
          payload.message ??
          `Retell call failed: ${response.status}`,
      );
    }

    return payload.call_id ? { providerId: payload.call_id } : {};
  }
}
