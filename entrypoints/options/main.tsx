import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { normalizeDomain } from "../../lib/domain";
import type { SwanMessage, SwanMessageResponse } from "../../lib/messages";
import {
  getEvents,
  getRules,
  getSettings,
  saveRules,
  saveSettings,
} from "../../lib/storage";
import type { DetectionRule, UrgeEvent, UserSettings } from "../../lib/types";
import "./style.css";

function OptionsApp() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [events, setEvents] = useState<UrgeEvent[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  const enabledRules = useMemo(
    () => rules.filter((rule) => rule.enabled).length,
    [rules],
  );

  if (!settings) {
    return <main className="shell">Loading Swan...</main>;
  }

  async function refresh() {
    const [nextSettings, nextRules, nextEvents] = await Promise.all([
      getSettings(),
      getRules(),
      getEvents(),
    ]);
    setSettings(nextSettings);
    setRules(nextRules);
    setEvents(nextEvents);
  }

  async function persistSettings(next: UserSettings) {
    setSettings(next);
    await saveSettings(next);
    setNotice("Settings saved locally.");
  }

  async function addRule() {
    const domain = normalizeDomain(newDomain);
    if (!domain) {
      setNotice("Enter a valid domain.");
      return;
    }

    if (rules.some((rule) => rule.domain === domain)) {
      setNotice("That domain is already tracked.");
      return;
    }

    const nextRules: DetectionRule[] = [
      {
        id: `user:${domain}:${Date.now()}`,
        domain,
        enabled: true,
        source: "user",
        createdAt: new Date().toISOString(),
      },
      ...rules,
    ];

    setRules(nextRules);
    setNewDomain("");
    await saveRules(nextRules);
    setNotice("Domain added.");
  }

  async function toggleRule(ruleId: string) {
    const nextRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
    );
    setRules(nextRules);
    await saveRules(nextRules);
  }

  async function removeRule(ruleId: string) {
    const nextRules = rules.filter((rule) => rule.id !== ruleId);
    setRules(nextRules);
    await saveRules(nextRules);
  }

  async function sendTestAlert() {
    setTesting(true);
    setNotice("Sending test alert...");

    const response = await chrome.runtime.sendMessage<
      SwanMessage,
      SwanMessageResponse
    >({ type: "SWAN_TEST_ALERT" });

    setTesting(false);
    await refresh();
    setNotice(
      response.ok
        ? "Test alert completed. Check the event history below."
        : response.error,
    );
  }

  return (
    <main className="shell">
      <section className="masthead">
        <div>
          <p className="eyebrow">Swan V0</p>
          <h1>Phone-first urge interruption.</h1>
          <p className="intro">
            Swan watches for configured NSFW domains in this browser and
            immediately sends an SMS and starts an AI call.
          </p>
        </div>
        <div className="statusPanel" aria-label="Swan status">
          <span className={settings.enabled ? "status on" : "status off"} />
          <strong>{settings.enabled ? "Monitoring on" : "Monitoring off"}</strong>
          <span>{enabledRules} active rules</span>
        </div>
      </section>

      {notice ? <p className="notice">{notice}</p> : null}

      <section className="band">
        <div className="sectionHeader">
          <h2>Runtime</h2>
          <button
            type="button"
            className="primary"
            disabled={testing}
            onClick={sendTestAlert}
          >
            {testing ? "Testing..." : "Send test alert"}
          </button>
        </div>
        <div className="grid two">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  enabled: event.currentTarget.checked,
                })
              }
            />
            Enable monitoring
          </label>
          <label>
            Cooldown minutes
            <input
              type="number"
              min="1"
              value={settings.cooldownMinutes}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  cooldownMinutes: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="band">
        <h2>Phone</h2>
        <div className="grid two">
          <label>
            Your phone number
            <input
              value={settings.phoneNumber}
              placeholder="+15551234567"
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  phoneNumber: event.currentTarget.value,
                })
              }
            />
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.smsEnabled}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  smsEnabled: event.currentTarget.checked,
                })
              }
            />
            Send SMS
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.callEnabled}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  callEnabled: event.currentTarget.checked,
                })
              }
            />
            Start AI call
          </label>
        </div>
      </section>

      <section className="band">
        <h2>Twilio SMS</h2>
        <div className="grid three">
          <label>
            Account SID
            <input
              value={settings.twilio.accountSid}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  twilio: {
                    ...settings.twilio,
                    accountSid: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
          <label>
            Auth token
            <input
              type="password"
              value={settings.twilio.authToken}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  twilio: {
                    ...settings.twilio,
                    authToken: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
          <label>
            From number
            <input
              value={settings.twilio.fromNumber}
              placeholder="+15557654321"
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  twilio: {
                    ...settings.twilio,
                    fromNumber: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="band">
        <h2>ElevenLabs AI Call</h2>
        <div className="grid three">
          <label>
            API key
            <input
              type="password"
              value={settings.elevenLabs.apiKey}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  elevenLabs: {
                    ...settings.elevenLabs,
                    apiKey: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
          <label>
            Agent ID
            <input
              value={settings.elevenLabs.agentId}
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  elevenLabs: {
                    ...settings.elevenLabs,
                    agentId: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
          <label>
            Agent phone number ID
            <input
              value={settings.elevenLabs.agentPhoneNumberId}
              placeholder="phnum_..."
              onChange={(event) =>
                void persistSettings({
                  ...settings,
                  elevenLabs: {
                    ...settings.elevenLabs,
                    agentPhoneNumberId: event.currentTarget.value,
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="band">
        <div className="sectionHeader">
          <h2>Tracked domains</h2>
          <div className="inlineForm">
            <input
              value={newDomain}
              placeholder="example.com"
              onChange={(event) => setNewDomain(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addRule();
              }}
            />
            <button type="button" onClick={addRule}>
              Add
            </button>
          </div>
        </div>
        <div className="ruleList">
          {rules.map((rule) => (
            <div className="row" key={rule.id}>
              <div>
                <strong>{rule.domain}</strong>
                <span>{rule.source}</span>
              </div>
              <div className="actions">
                <button type="button" onClick={() => void toggleRule(rule.id)}>
                  {rule.enabled ? "Disable" : "Enable"}
                </button>
                {rule.source === "user" ? (
                  <button type="button" onClick={() => void removeRule(rule.id)}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="band">
        <h2>Recent events</h2>
        <div className="eventList">
          {events.length === 0 ? <p>No events yet.</p> : null}
          {events.map((event) => (
            <div className="row" key={event.id}>
              <div>
                <strong>{event.domain}</strong>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <span>
                SMS {event.smsStatus.state} / Call {event.callStatus.state}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
