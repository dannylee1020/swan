# Provider Setup

Swan needs ElevenLabs voice-call provider credentials before real interventions can run.

Swan uses one provider path:

- ElevenLabs starts AI phone calls through its outbound-call API.
- A phone number must be connected inside ElevenLabs for voice calls.

Do not create a separate Voice/TwiML app for Swan v0. Configure the phone
number inside ElevenLabs and use the ElevenLabs phone number ID in Swan.

## Values Swan Needs

Enter these in the Swan options page:

- Recipient phone number: your phone number in E.164 format, for example `+15551234567`.
- ElevenLabs API key.
- ElevenLabs Agent ID.
- ElevenLabs Agent phone number ID.

Save the phone and ElevenLabs cards separately after entering values.

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
2. Connect or import a phone number using the ElevenLabs dashboard flow.
3. Let ElevenLabs detect the number capabilities.
4. Link the number to the Swan agent if the dashboard flow asks for it.
5. Copy the resulting ElevenLabs phone number ID.
6. In Swan, paste it into Agent phone number ID.

Purchased numbers can support inbound and outbound calls. Verified caller IDs
are outbound-only. Test the outbound call from ElevenLabs before testing Swan.

## 4. Test Swan

1. Open the Swan options page.
2. Enter your recipient phone number.
3. Confirm Start voice call is enabled.
4. Click Send test alert.
5. Confirm the AI call arrives from the ElevenLabs-connected number.
6. Check Swan recent events for call status.

If the call fails, check ElevenLabs call history before changing Swan configuration.

## Troubleshooting

- Call fails: confirm the phone number was imported or verified in ElevenLabs and use the ElevenLabs phone number ID, not the literal phone number.
- Call fails immediately: confirm the ElevenLabs API key, Agent ID, and Agent phone number ID all belong to the same ElevenLabs workspace.
- No inbound behavior: verified caller IDs are outbound-only.

## Security Note

Swan v0 stores provider credentials in browser extension local storage. Treat this as browser-local software connected to your own provider accounts, not a managed production secret model.

## After Provider Setup

Return to [Test and verify](./guide/test-and-verify.md), send a test alert, and inspect the latest Swan log entry.

## References

- ElevenLabs outbound call API: https://elevenlabs.io/docs/api-reference/conversations/outbound-call
- ElevenLabs phone numbers: https://elevenlabs.io/docs/agents-platform/phone-numbers
