# Provider Setup

Swan uses two provider paths:

- Twilio sends SMS alerts directly.
- ElevenLabs starts AI phone calls through its native Twilio outbound-call integration.

Do not create a Twilio Voice/TwiML app for Swan v0. If a Twilio phone number is used for calls, import or verify that number inside ElevenLabs and use the ElevenLabs phone number ID in Swan.

## Values Swan Needs

Enter these in the Swan options page:

- Recipient phone number: your phone number in E.164 format, for example `+15551234567`.
- Twilio Account SID.
- Twilio Auth token.
- Twilio SMS From number.
- ElevenLabs API key.
- ElevenLabs Agent ID.
- ElevenLabs Agent phone number ID.

## 1. Configure Twilio for SMS

1. Create or log into a Twilio account.
2. Buy or configure a Twilio phone number that supports SMS.
3. If you are using a Twilio trial account, verify the recipient phone number before testing Swan.
4. In the Twilio Console, copy your Account SID and Auth Token.
5. Copy the SMS-capable Twilio phone number in E.164 format.
6. In Swan, enter:
   - Account SID
   - Auth token
   - From number

Swan sends SMS with Twilio's Messages API using `To`, `From`, and `Body`.

## 2. Create an ElevenLabs Agent

1. Open ElevenLabs and create a Conversational AI agent.
2. Give the agent an initial message suitable for an intervention call, for example:
   `Swan detected a risky browsing moment. Step away from the device and talk this through.`
3. Configure the agent voice and conversation behavior.
4. Copy the Agent ID.

## 3. Create an ElevenLabs API Key

1. In ElevenLabs, open the API keys area.
2. Create an API key with access to Conversational AI calls.
3. Copy the key immediately and store it somewhere safe.
4. In Swan, paste it into the ElevenLabs API key field.

## 4. Connect a Phone Number in ElevenLabs

1. In ElevenLabs, open the Phone Numbers area for the Agents platform.
2. Import or connect the Twilio number.
3. Enter:
   - A descriptive label
   - The Twilio phone number
   - Twilio Account SID
   - Twilio Auth Token
4. Let ElevenLabs detect the number capabilities.
5. Link the number to the Swan agent if the dashboard flow asks for it.
6. Copy the resulting ElevenLabs phone number ID.
7. In Swan, paste it into Agent phone number ID.

Purchased Twilio numbers can support inbound and outbound calls. Verified caller IDs are outbound-only.

## 5. Test Swan

1. Open the Swan options page.
2. Enter your recipient phone number.
3. Confirm Send SMS and Start AI call are enabled.
4. Click Send test alert.
5. Confirm the SMS arrives from the Twilio number.
6. Confirm the AI call arrives from the ElevenLabs-connected number.
7. Check Swan recent events for SMS and call status.

If either provider fails, check Twilio messaging logs and ElevenLabs call history before changing Swan configuration.

## Troubleshooting

- SMS fails: confirm the Twilio Auth Token, Account SID, SMS-capable From number, and recipient number.
- SMS fails on a trial account: verify the recipient number in Twilio.
- Call fails: confirm the phone number was imported or verified in ElevenLabs and use the ElevenLabs phone number ID, not the literal phone number.
- Call fails immediately: confirm the ElevenLabs API key, Agent ID, and Agent phone number ID all belong to the same ElevenLabs workspace.
- No inbound behavior: verified caller IDs are outbound-only.

## Security Note

Swan v0 stores provider credentials in browser extension local storage. Treat this as self-hosted developer setup, not a managed production secret model. A managed version should move provider credentials to a backend.

## References

- ElevenLabs outbound call API: https://elevenlabs.io/docs/api-reference/conversations/outbound-call
- ElevenLabs Twilio native integration: https://elevenlabs.io/docs/agents-platform/phone-numbers/twilio-integration/native-integration
- Twilio Message resource: https://www.twilio.com/docs/messaging/api/message-resource
- Twilio phone numbers: https://www.twilio.com/docs/phone-numbers
