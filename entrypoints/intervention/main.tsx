import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import type { SwanMessage, SwanMessageResponse } from "../../lib/messages";
import type { UrgeEvent } from "../../lib/types";
import "./style.css";

function InterventionApp() {
  const [event, setEvent] = useState<UrgeEvent | null>(null);
  const [error, setError] = useState("");
  const eventId = useMemo(
    () => new URLSearchParams(location.search).get("eventId"),
    [],
  );

  useEffect(() => {
    void loadEvent();
  }, []);

  async function loadEvent() {
    if (!eventId) {
      setError("Missing event id.");
      return;
    }

    const response = await browser.runtime.sendMessage<
      SwanMessage,
      SwanMessageResponse
    >({ type: "SWAN_GET_EVENT", eventId });

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setEvent(response.event ?? null);
  }

  return (
    <main className="screen">
      <section className="panel">
        <p className="eyebrow">Swan interrupted this loop</p>
        <h1>Step away and answer the phone.</h1>
        <p className="copy">
          A phone intervention was triggered for this browser activity. Put the
          device down, stand up, and stay on the call.
        </p>

        {error ? <p className="notice">{error}</p> : null}

        {event ? (
          <div className="eventBox">
            <div>
              <span>Detected domain</span>
              <strong>{event.domain}</strong>
            </div>
            <div>
              <span>SMS</span>
              <strong>{event.smsStatus.state}</strong>
            </div>
            <div>
              <span>Call</span>
              <strong>{event.callStatus.state}</strong>
            </div>
          </div>
        ) : null}

        <div className="actions">
          <button type="button" onClick={() => void loadEvent()}>
            Refresh status
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void browser.runtime.openOptionsPage()}
          >
            Open setup
          </button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InterventionApp />
  </React.StrictMode>,
);
