import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import type { SwanMessage, SwanMessageResponse } from "../../lib/messages";
import type { AlertStatus, UrgeEvent } from "../../lib/types";
import "./style.css";

const EVENT_PENDING_MESSAGE = "Preparing intervention status...";

function InterventionApp() {
  const [event, setEvent] = useState<UrgeEvent | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const eventId = useMemo(
    () => new URLSearchParams(location.search).get("eventId"),
    [],
  );

  useEffect(() => {
    void loadEvent();
  }, []);

  useEffect(() => {
    const isWaitingForEvent = !event && error === EVENT_PENDING_MESSAGE;
    const hasPendingStatus =
      event?.callStatus.state === "pending" || event?.smsStatus.state === "pending";
    if (!hasPendingStatus && !isWaitingForEvent) return;

    const intervalId = window.setInterval(() => {
      void loadEvent();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [error, event, event?.callStatus.state, event?.smsStatus.state]);

  async function loadEvent() {
    if (!eventId) {
      setError("Missing event id.");
      return;
    }

    setIsRefreshing(true);
    let response: SwanMessageResponse;
    try {
      response = await browser.runtime.sendMessage<SwanMessage, SwanMessageResponse>({
        type: "SWAN_GET_EVENT",
        eventId,
      });
    } catch {
      setError("Swan extension runtime is unavailable.");
      setIsRefreshing(false);
      return;
    }

    if (!response.ok) {
      setError(
        response.error === "Event not found" ? EVENT_PENDING_MESSAGE : response.error,
      );
      setIsRefreshing(false);
      return;
    }

    setError("");
    setEvent(response.event ?? null);
    setIsRefreshing(false);
  }

  async function openSetup() {
    try {
      await browser.runtime.openOptionsPage();
    } catch {
      setError("Open Swan from the extension toolbar to adjust setup.");
    }
  }

  const detectedDomain = event?.domain ?? "Waiting for event";

  return (
    <main className="screen">
      <section className="interventionSurface" aria-labelledby="intervention-title">
        <div className="heroBlock">
          <p className="eyebrow">Swan interrupted this loop</p>
          <h1 id="intervention-title">Step away and answer the phone.</h1>
          <p className="copy">
            A phone intervention was triggered for this browser activity. Put the
            device down, stand up, and stay on the call.
          </p>
        </div>

        {error ? (
          <p className="notice" role="alert">
            {error}
          </p>
        ) : null}

        <section className="domainBlock" aria-label="Detected domain">
          <span>Detected domain</span>
          <strong>{detectedDomain}</strong>
        </section>

        <div className="statusRows" aria-label="Alert delivery status" aria-live="polite">
          <StatusRow label="Call" status={event?.callStatus ?? { state: "pending" }} />
          <StatusRow label="SMS" status={event?.smsStatus ?? { state: "pending" }} />
        </div>

        <div className="actions">
          <button
            type="button"
            className="primaryAction"
            onClick={() => void openSetup()}
          >
            Open setup
          </button>
          <button
            type="button"
            className="secondaryAction"
            disabled={isRefreshing}
            onClick={() => void loadEvent()}
          >
            {isRefreshing ? "Refreshing..." : "Refresh status"}
          </button>
        </div>
      </section>
    </main>
  );
}

function StatusRow({ label, status }: { label: string; status: AlertStatus }) {
  return (
    <section className="statusRow" aria-label={`${label} status`}>
      <strong>{label}</strong>
      <span className={`statusChip ${status.state}`}>{status.state}</span>
      {formatStatusDetail(status) ? (
        <span className="statusDetail">{formatStatusDetail(status)}</span>
      ) : null}
    </section>
  );
}

function formatStatusDetail(status: AlertStatus): string {
  if (status.state === "failed") return status.error;
  if (status.state === "skipped") return status.reason;
  if (status.state === "success") return status.providerId ?? "";
  return "";
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InterventionApp />
  </React.StrictMode>,
);
