# Swan ElevenLabs Agent Package

Use these files to configure the Swan voice agent in ElevenLabs.

- [System prompt](./easypeasy-system-prompt.md): paste into the ElevenLabs
  agent instructions. This controls behavior, tone, safety boundaries, and
  conversation style.
- [Swan Recovery Playbook](./swan-recovery-playbook.md): upload as the
  knowledge base. This gives the agent deeper EasyPeasy-style recovery context
  to retrieve during conversation.
- [End Call tool](#end-call-tool): configure ElevenLabs' system tool so the
  agent can end the intervention once the caller has a concrete next action.

The system prompt should stay relatively compact. Put the agent's behavior in
the prompt, and put longer recovery context in the knowledge base.

## Set up in ElevenLabs

1. Open ElevenLabs and create or edit the Swan Conversational AI agent.
2. Open [System prompt](./easypeasy-system-prompt.md).
3. Copy the system prompt block into the agent instructions or system prompt
   field.
4. Copy the first message into the first-message or opening-message field.
5. Open [Swan Recovery Playbook](./swan-recovery-playbook.md).
6. Upload the playbook as the agent knowledge base.
7. Attach or enable that knowledge base for the Swan agent.
8. Add the **End Call** system tool using the description below.
9. Save the agent.
10. Run a direct ElevenLabs test call before testing through Swan.

## Recommended ElevenLabs settings

- **First message:** use the first message from the system prompt file.
- **Model:** start with the balanced default recommended by ElevenLabs for
  conversational agents. If the agent feels shallow, test a stronger reasoning
  model and compare latency.
- **Voice:** choose a calm, grounded, emotionally expressive voice. Avoid a
  sales, hype, or customer-support tone.
- **Turn-taking:** use a patient setting so the user has room to speak.
- **Interruptions:** keep interruptions enabled so the user can cut in
  naturally.
- **Timeout:** after a few seconds of silence, use a quiet check-in such as
  `I'm here. Take your time.`

## End Call tool

Add ElevenLabs' **End Call** system tool to the Swan agent. Use this description
in the tool form:

```text
End the call only after Swan's minimum intervention is complete.

Use this tool when one of these is true:

- The caller has closed or locked the screen, moved away from the device, and chosen a concrete next action.
- The caller clearly says they are done, safe, or ready to go.
- The caller stays silent after two gentle check-ins and you have already given a simple physical next action.
- The caller is keeping the call going to avoid acting, and you have already given the next action.

Before ending, give one short closing instruction and explain that you are ending the call so they can act.

Do not end abruptly, punitively, or while the caller is actively processing shame, distress, defensiveness, or a real question.

If the caller mentions self-harm, danger, abuse, or that they cannot stay safe, do not use the normal ending rule. Follow the safety boundary instead.
```
