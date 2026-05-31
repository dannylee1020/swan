import type { AlertContext, CallProvider, ProviderResult } from "../types";
import { selectOpeningVariant } from "../opening-variants";

export class ElevenLabsCallProvider implements CallProvider {
  async start({ event, settings }: AlertContext): Promise<ProviderResult> {
    const { apiKey, agentId, agentPhoneNumberId } = settings.elevenLabs;
    if (!settings.phoneNumber || !apiKey || !agentId || !agentPhoneNumberId) {
      throw new Error("ElevenLabs call is not configured");
    }

    const opening = selectOpeningVariant();

    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: agentPhoneNumberId,
          to_number: settings.phoneNumber,
          conversation_initiation_client_data: {
            dynamic_variables: {
              swan_event_id: event.id,
              swan_detected_domain: event.domain,
              swan_detected_at: event.timestamp,
              swan_opening_message: opening.message,
              swan_opening_style: opening.style,
              swan_intervention_tone: opening.tone,
            },
          },
        }),
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      conversation_id?: string;
      callSid?: string;
      message?: string;
      detail?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.detail ??
          payload.message ??
          `ElevenLabs call failed: ${response.status}`,
      );
    }

    return payload.conversation_id
      ? { providerId: payload.conversation_id }
      : payload.callSid
        ? { providerId: payload.callSid }
        : {};
  }
}
