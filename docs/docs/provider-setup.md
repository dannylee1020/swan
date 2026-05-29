# Provider Setup

Swan needs ElevenLabs voice-call provider credentials before real interventions can run.

Swan uses two provider paths:

- ElevenLabs starts AI phone calls through its outbound-call API.
- A Twilio number must be connected or imported inside ElevenLabs for voice calls, but Swan does not use Twilio credentials for voice.
- Twilio can send optional SMS alerts directly when enabled.

Do not create a Twilio Voice/TwiML app for Swan v0. ElevenLabs voice calls
need a paid/upgraded Twilio account. Trial Twilio accounts can ring and play
the trial message, but the ElevenLabs agent may not connect afterward. Import
or verify the Twilio number inside ElevenLabs and use the ElevenLabs phone
number ID in Swan. Enter Twilio credentials in Swan only if you also want
optional direct SMS alerts.

## Values Swan Needs

Enter these in the Swan options page:

- Recipient phone number: your phone number in E.164 format, for example `+15551234567`.
- ElevenLabs API key.
- ElevenLabs Agent ID.
- ElevenLabs Agent phone number ID.
- Optional SMS only: Twilio Account SID, API Key SID, client secret, and SMS From number.

Save the ElevenLabs and Twilio cards separately after entering values. The Twilio SMS card can stay empty when SMS is disabled.

## 1. Create an ElevenLabs Agent

1. Open ElevenLabs and create a Conversational AI agent.
2. Configure the Swan [agent prompt and knowledge base](./agent/).
3. Paste the [system prompt](./agent/easypeasy-system-prompt.md) into the agent
   instructions or system prompt field.
4. Upload the [Swan Recovery Playbook](./agent/swan-recovery-playbook.md) as
   the agent knowledge base.
5. Add the End Call system tool from the agent setup guide.
6. Configure the agent voice and conversation behavior.
7. Run a direct ElevenLabs test call.
8. Copy the Agent ID.

## 2. Create an ElevenLabs API Key

1. In ElevenLabs, open the API keys area.
2. Create an API key with access to Conversational AI calls.
3. Copy the key immediately and store it somewhere safe.
4. In Swan, paste it into the ElevenLabs API key field.

## 3. Connect a Phone Number in ElevenLabs

1. In ElevenLabs, open the Phone Numbers area for the Agents platform.
2. Import or connect the paid/upgraded Twilio number.
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
For Swan testing, do not use a Twilio trial account for the ElevenLabs
voice-call path. Upgrade Twilio first, then test the outbound call from
ElevenLabs before testing Swan.

## Optional: Configure Twilio for SMS

Skip this section if you only want voice calls. Swan does not need these
Twilio credentials for the ElevenLabs voice-call path.

1. Create or log into a Twilio account.
2. Buy or configure a Twilio phone number that supports SMS.
3. If you are using a Twilio trial account, verify the recipient phone number before testing Swan.
4. In the Twilio Console, create an API key and copy your Account SID, API Key SID, and client secret.
5. Copy the SMS-capable Twilio phone number in E.164 format.
6. In Swan, enter:
   - Account SID
   - API Key SID
   - Client secret
   - From number

Swan sends SMS with Twilio's Messages API using `To`, `From`, and `Body`.
For US messaging, Twilio may require messaging compliance setup such as A2P 10DLC before production SMS delivery works reliably.

## 4. Test Swan

1. Open the Swan options page.
2. Enter your recipient phone number.
3. Confirm Start voice call is enabled.
4. Click Send test alert.
5. Confirm the AI call arrives from the ElevenLabs-connected number.
6. If SMS is enabled, confirm the SMS arrives from the Twilio number.
7. Check Swan recent events for SMS and call status.

If the call fails, check ElevenLabs call history before changing Swan configuration. If optional SMS fails, check Twilio messaging logs.

## Troubleshooting

- SMS fails: confirm the Twilio Account SID, API Key SID, client secret, SMS-capable From number, and recipient number.
- SMS is skipped: confirm the Send optional SMS toggle is enabled.
- SMS fails on a trial account: verify the recipient number in Twilio.
- Call rings but the agent is silent after the Twilio trial message: upgrade Twilio and re-test the outbound call from ElevenLabs.
- Call fails: confirm the phone number was imported or verified in ElevenLabs and use the ElevenLabs phone number ID, not the literal phone number.
- Call fails immediately: confirm the ElevenLabs API key, Agent ID, and Agent phone number ID all belong to the same ElevenLabs workspace.
- No inbound behavior: verified caller IDs are outbound-only.

## Security Note

Swan v0 stores provider credentials in browser extension local storage. Treat this as browser-local software connected to your own provider accounts, not a managed production secret model.

## After Provider Setup

Return to [Test and verify](./guide/test-and-verify.md), send a test alert, and inspect the latest Swan log entry.

## References

- ElevenLabs outbound call API: https://elevenlabs.io/docs/api-reference/conversations/outbound-call
- ElevenLabs Twilio native integration: https://elevenlabs.io/docs/agents-platform/phone-numbers/twilio-integration/native-integration
- Twilio Message resource: https://www.twilio.com/docs/messaging/api/message-resource
- Twilio phone numbers: https://www.twilio.com/docs/phone-numbers
