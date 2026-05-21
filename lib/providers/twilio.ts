import type { AlertContext, SmsProvider, ProviderResult } from "../types";

export class TwilioSmsProvider implements SmsProvider {
  async send({ event, settings }: AlertContext): Promise<ProviderResult> {
    const { accountSid, authToken, fromNumber } = settings.twilio;
    if (!settings.phoneNumber || !accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio SMS is not configured");
    }

    const body = new URLSearchParams({
      To: settings.phoneNumber,
      From: fromNumber,
      Body: `Swan detected an urge episode on ${event.domain}. Step away from the device and answer the call.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(payload.message ?? `Twilio SMS failed: ${response.status}`);
    }

    return payload.sid ? { providerId: payload.sid } : {};
  }
}
