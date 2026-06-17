import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AudioLines,
  Ban,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock,
  CreditCard,
  Globe2,
  List,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { browser } from "wxt/browser";
import {
  applyBootstrap,
  parseSwanBootstrap,
  summarizeBootstrap,
  type BootstrapSummary,
  type SwanBootstrap,
} from "../../lib/bootstrap";
import { normalizeDomain } from "../../lib/domain";
import type { SwanMessage, SwanMessageResponse } from "../../lib/messages";
import {
  getEvents,
  getRules,
  getSettings,
  saveRules,
  saveSettings,
} from "../../lib/storage";
import { formatPhoneNumberE164 } from "../../lib/phone";
import {
  getManagedApiBaseUrl,
  ManagedClient,
} from "../../lib/managed/client";
import type {
  AlertStatus,
  DetectionRule,
  DeliveryMode,
  ManagedAccount,
  UrgeEvent,
  UserSettings,
} from "../../lib/types";
import {
  getReadinessState,
  getSettingsFieldErrors,
  validatePhoneNumber,
  type ReadinessState,
  type SettingsFieldErrors,
} from "./readiness";
import "./style.css";

type ActivePage = "general" | "plan" | "domains" | "logs";
type DomainFilter = "all" | "enabled" | "disabled" | "user" | "seed";
type LogFilter = "all" | AlertStatus["state"];
type SettingsCardId = "phone" | "elevenLabs";
type SaveState = "idle" | "saving" | "saved";
type ManagedOtpState = {
  challengeId: string;
  phoneNumber: string;
} | null;
type ManagedAuthErrorField = "phone" | "code";
type ManagedAuthLocalError = {
  field: ManagedAuthErrorField;
  message: string;
} | null;
type RemovedRuleUndo = { rule: DetectionRule; index: number } | null;
type BootstrapInfo =
  | { state: "checking" }
  | { state: "missing" }
  | { state: "available"; bootstrap: SwanBootstrap; summary: BootstrapSummary }
  | { state: "error"; error: string };

const navItems: Array<{ id: ActivePage; label: string; icon: LucideIcon }> = [
  { id: "general", label: "Status", icon: CheckCircle2 },
  { id: "plan", label: "Plan", icon: CreditCard },
  { id: "domains", label: "Domains", icon: Globe2 },
  { id: "logs", label: "History", icon: List },
];

function OptionsApp() {
  const [activePage, setActivePage] = useState<ActivePage>("general");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<UserSettings | null>(null);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [events, setEvents] = useState<UrgeEvent[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainSearch, setDomainSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [managedBusy, setManagedBusy] = useState(false);
  const [managedError, setManagedError] = useState("");
  const [managedOtpState, setManagedOtpState] = useState<ManagedOtpState>(null);
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});
  const [domainError, setDomainError] = useState("");
  const [removedRuleUndo, setRemovedRuleUndo] = useState<RemovedRuleUndo>(null);
  const [bootstrapInfo, setBootstrapInfo] = useState<BootstrapInfo>({
    state: "checking",
  });
  const [saveState, setSaveState] = useState<Record<SettingsCardId, SaveState>>({
    phone: "idle",
    elevenLabs: "idle",
  });

  useEffect(() => {
    void refresh();
    void loadBootstrapInfo();
  }, []);

  const eventCountsByRule = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      counts.set(event.ruleId, (counts.get(event.ruleId) ?? 0) + 1);
    });
    return counts;
  }, [events]);

  const filteredRules = useMemo(() => {
    const query = domainSearch.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesSearch = !query || rule.domain.includes(query);
      const matchesFilter =
        domainFilter === "all" ||
        (domainFilter === "enabled" && rule.enabled) ||
        (domainFilter === "disabled" && !rule.enabled) ||
        domainFilter === rule.source;
      return matchesSearch && matchesFilter;
    });
  }, [domainFilter, domainSearch, rules]);

  const rulesById = useMemo(
    () => new Map(rules.map((rule) => [rule.id, rule])),
    [rules],
  );

  const filteredEvents = useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch = !query || event.domain.includes(query);
      const matchesStatus = logFilter === "all" || event.callStatus.state === logFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, logFilter, logSearch]);

  const managedApiConfigured = Boolean(getManagedApiBaseUrl());
  const readiness = useMemo(
    () =>
      settingsDraft
        ? getReadinessState({
            events,
            managedApiConfigured,
            rules,
            settings: settingsDraft,
          })
        : null,
    [events, managedApiConfigured, rules, settingsDraft],
  );

  async function refresh() {
    let [nextSettings, nextRules, nextEvents] = await Promise.all([
      getSettings(),
      getRules(),
      getEvents(),
    ]);
    const managedModeUnavailable =
      !managedApiConfigured &&
      (nextSettings.deliveryMode !== "byok" || !nextSettings.onboardingCompleted);
    if (managedModeUnavailable) {
      nextSettings = {
        ...nextSettings,
        deliveryMode: "byok",
        onboardingCompleted: true,
      };
      await saveSettings(nextSettings);
      setActivePage("general");
      setNotice("Use my ElevenLabs account selected. Add your setup details to continue.");
    }
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setRules(nextRules);
    setEvents(nextEvents);
    setSaveState({ phone: "idle", elevenLabs: "idle" });
  }

  async function loadBootstrapInfo() {
    setBootstrapInfo({ state: "checking" });

    try {
      const bootstrap = await fetchBundledBootstrap();
      if (!bootstrap) {
        setBootstrapInfo({ state: "missing" });
        return;
      }
      setBootstrapInfo({
        state: "available",
        bootstrap,
        summary: summarizeBootstrap(bootstrap),
      });
    } catch (error) {
      setBootstrapInfo({
        state: "error",
        error:
          error instanceof Error ? error.message : "Could not load import data.",
      });
    }
  }

  function updateSettingsDraft(cardId: SettingsCardId, next: UserSettings) {
    setSettingsDraft(next);
    setFieldErrors({});
    setSaveState((current) => ({ ...current, [cardId]: "idle" }));
  }

  async function changeDeliveryMode(deliveryMode: DeliveryMode) {
    if (!settings || !settingsDraft || settings.deliveryMode === deliveryMode) {
      return;
    }
    if (deliveryMode === "managed" && !managedApiConfigured) return;

    const nextSettings = { ...settings, ...settingsDraft, deliveryMode };
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setSaveState({ phone: "idle", elevenLabs: "idle" });
    setNotice(
      deliveryMode === "managed"
        ? "Swan Managed selected. Sign in, then start your subscription."
        : "Use my ElevenLabs account selected. Swan will use local setup.",
    );
  }

  async function completeByokOnboarding(phoneNumber: string) {
    if (!settings || !settingsDraft) return;

    const nextSettings = {
      ...settings,
      ...settingsDraft,
      deliveryMode: "byok" as const,
      phoneNumber,
      onboardingCompleted: true,
    };
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setActivePage("general");
    setNotice("Use my ElevenLabs account selected. Add your setup details to continue.");
  }

  async function saveSettingsCard(
    cardId: SettingsCardId,
    validateDelivery = false,
  ): Promise<boolean> {
    if (!settings || !settingsDraft) return false;

    setSaveState((current) => ({ ...current, [cardId]: "saving" }));
    try {
      const errors = getCardFieldErrors(settingsDraft, cardId, validateDelivery);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSaveState((current) => ({ ...current, [cardId]: "idle" }));
        return false;
      }

      const nextSettings = mergeSettingsCard(settings, settingsDraft, cardId);
      await saveSettings(nextSettings);
      if (cardId === "phone" && nextSettings.managedAccount) {
        await syncManagedSettings(nextSettings);
      }
      setSettings(nextSettings);
      setSettingsDraft((currentDraft) =>
        currentDraft
          ? mergeSettingsCard(currentDraft, nextSettings, cardId)
          : nextSettings,
      );
      setSaveState((current) => ({ ...current, [cardId]: "saved" }));
      setNotice("Settings saved locally.");
      return true;
    } catch (error) {
      setSaveState((current) => ({ ...current, [cardId]: "idle" }));
      setNotice(formatManagedError(error));
      return false;
    }
  }

  async function syncManagedSettings(nextSettings: UserSettings) {
    if (!nextSettings.managedAccount) return;
    const client = createManagedClient();
    await client.updateSettings(nextSettings.managedAccount, {
      enabled: nextSettings.enabled,
    });
  }

  async function startManagedSignup(phoneNumber: string) {
    if (!settings || !settingsDraft || managedBusy) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const response = await client.startSignupOtp({
        name: "",
        email: "",
        phoneNumber,
      });
      setManagedOtpState({
        challengeId: response.challengeId,
        phoneNumber,
      });
      setNotice("Verification code sent.");
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function verifyManagedOtp(code: string) {
    if (!settings || !settingsDraft || !managedOtpState || managedBusy) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const auth = await client.verifySignupOtp({
        challengeId: managedOtpState.challengeId,
        code,
        name: "",
        email: "",
        phoneNumber: managedOtpState.phoneNumber,
      });
      const managedAccount = await client.fetchMe(auth.account);
      const nextSettings = {
        ...settings,
        ...settingsDraft,
        deliveryMode: "managed" as const,
        managedAccount,
        onboardingCompleted: true,
      };
      await saveSettings(nextSettings);
      setSettings(nextSettings);
      setSettingsDraft(nextSettings);
      setManagedOtpState(null);
      setActivePage(managedAccount.entitlementActive ? "general" : "plan");
      setNotice(
        managedAccount.entitlementActive
          ? "Swan Managed is ready."
          : "Start your Swan Managed subscription to enable hosted calls.",
      );
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function refreshManagedAccount() {
    if (!settings?.managedAccount) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const managedAccount = await client.fetchMe(settings.managedAccount);
      await updateManagedAccount(managedAccount);
      setNotice("Swan status refreshed.");
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function openManagedCheckout() {
    if (!settings?.managedAccount) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const response = await client.createCheckout(settings.managedAccount);
      window.open(response.checkoutUrl, "_blank", "noopener,noreferrer");
      setNotice("Stripe Checkout opened. Refresh Swan after payment completes.");
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function openManagedPortal() {
    if (!settings?.managedAccount) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const response = await client.createPortal(settings.managedAccount);
      window.open(response.portalUrl, "_blank", "noopener,noreferrer");
      setNotice("Stripe billing portal opened.");
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function signOutManagedAccount() {
    if (!settings?.managedAccount || !settingsDraft) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      await client.logout(settings.managedAccount);
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      const nextSettings = {
        ...settings,
        ...settingsDraft,
        managedAccount: null,
      };
      await saveSettings(nextSettings);
      setSettings(nextSettings);
      setSettingsDraft(nextSettings);
      setManagedOtpState(null);
      setManagedBusy(false);
      setNotice("Signed out of Swan on this browser.");
    }
  }

  async function updateManagedAccount(
    managedAccount: ManagedAccount,
    onboardingCompleted = false,
  ) {
    if (!settings || !settingsDraft) return;

    const nextSettings = {
      ...settings,
      ...settingsDraft,
      managedAccount,
      onboardingCompleted: settings.onboardingCompleted || onboardingCompleted,
    };
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
  }

  async function addRule() {
    const domain = normalizeDomain(newDomain);
    if (!domain) {
      setDomainError("Enter a valid domain, for example reddit.com.");
      return;
    }

    if (rules.some((rule) => rule.domain === domain)) {
      setDomainError("That domain is already tracked.");
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
    setDomainError("");
    setRemovedRuleUndo(null);
    await saveRules(nextRules);
    setNotice("Domain added.");
  }

  async function toggleRule(ruleId: string) {
    const nextRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
    );
    setRules(nextRules);
    setRemovedRuleUndo(null);
    await saveRules(nextRules);
  }

  async function removeRule(ruleId: string) {
    const index = rules.findIndex((rule) => rule.id === ruleId);
    if (index < 0) return;

    const removedRule = rules[index];
    if (!removedRule) return;

    const nextRules = rules.filter((rule) => rule.id !== ruleId);
    setRules(nextRules);
    setRemovedRuleUndo({ rule: removedRule, index });
    setNotice("");
    await saveRules(nextRules);
  }

  async function sendTestAlert() {
    if (readiness?.blockers.length) {
      setNotice(readiness.blockers[0] ?? "Complete setup before testing.");
      return;
    }

    setTesting(true);
    setNotice("Sending test alert...");

    const response = await browser.runtime.sendMessage<
      SwanMessage,
      SwanMessageResponse
    >({ type: "SWAN_TEST_ALERT" });

    setTesting(false);
    await refresh();
    setNotice(
      response.ok
        ? "Test alert completed. Check History for the latest event."
        : response.error,
    );
  }

  async function undoRemoveRule() {
    if (!removedRuleUndo) return;

    const { index, rule } = removedRuleUndo;
    const existing = rules.some((candidate) => candidate.id === rule.id);
    const nextRules = existing
      ? rules
      : [
          ...rules.slice(0, Math.min(index, rules.length)),
          rule,
          ...rules.slice(Math.min(index, rules.length)),
        ];

    setRules(nextRules);
    setRemovedRuleUndo(null);
    await saveRules(nextRules);
    setNotice("Domain restored.");
  }

  async function importBundledData() {
    if (!settings) return;

    setImportingData(true);
    setNotice("Importing data from bundled config...");

    try {
      const bootstrap =
        bootstrapInfo.state === "available"
          ? bootstrapInfo.bootstrap
          : await fetchBundledBootstrap();

      if (!bootstrap) {
        setBootstrapInfo({ state: "missing" });
        setNotice("No bundled import data found. Add config.yaml and rebuild.");
        return;
      }

      const result = applyBootstrap(settings, rules, bootstrap);
      await Promise.all([saveSettings(result.settings), saveRules(result.rules)]);
      setSettings(result.settings);
      setSettingsDraft(result.settings);
      setRules(result.rules);
      setSaveState({ phone: "idle", elevenLabs: "idle" });
      setBootstrapInfo({
        state: "available",
        bootstrap,
        summary: summarizeBootstrap(bootstrap),
      });
      setNotice(
        `Imported data from config.yaml. Added ${result.addedRules} domains and updated ${result.updatedRules}.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImportingData(false);
    }
  }

  if (!settings || !settingsDraft || !readiness) {
    return <main className="loadingShell">Loading Swan...</main>;
  }

  if (!settingsDraft.onboardingCompleted) {
    return (
      <OnboardingPage
        busy={managedBusy}
        error={managedError}
        managedApiConfigured={managedApiConfigured}
        otpState={managedOtpState}
        onCancelManagedOtp={() => setManagedOtpState(null)}
        onCompleteByok={completeByokOnboarding}
        onStartManagedSignup={startManagedSignup}
        onVerifyManagedOtp={verifyManagedOtp}
      />
    );
  }

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Swan navigation">
        <div className="brandBlock">
          <div className="brandMark">
            <h1>Swan</h1>
          </div>
        </div>

        <nav className="navList">
          {navItems.map((item) => (
            <button
              className={activePage === item.id ? "navItem active" : "navItem"}
              key={item.label}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <a
            className="navItem"
            href="https://swan-oss.com/docs/provider-setup"
            rel="noreferrer"
            target="_blank"
          >
            <BookOpen size={18} aria-hidden="true" />
            <span>Documentation</span>
          </a>
          <a
            className="navItem"
            href="https://github.com/dannylee1020/swan/issues"
            rel="noreferrer"
            target="_blank"
          >
            <CircleHelp size={18} aria-hidden="true" />
            <span>Support</span>
          </a>
        </div>
      </aside>

      <main className="mainPane">
        <header className="topbar">
          <StatusPill enabled={settings.enabled} />
          {activePage === "general" ? (
            <div className="topbarActions">
              <button
                type="button"
                className="primaryButton"
                disabled={testing || readiness.blockers.length > 0}
                title={
                  readiness.blockers.length
                    ? readiness.blockers.join(" ")
                    : "Send a test alert"
                }
                onClick={sendTestAlert}
              >
                <Send size={15} aria-hidden="true" />
                <span>{testing ? "Testing..." : "Send test alert"}</span>
              </button>
            </div>
          ) : null}
        </header>

        <div className="content">
          {notice ? <p className="notice">{notice}</p> : null}

          {activePage === "general" ? (
            <StatusPage
              bootstrapInfo={bootstrapInfo}
              fieldErrors={fieldErrors}
              importingData={importingData}
              managedApiConfigured={managedApiConfigured}
              onChangeDeliveryMode={changeDeliveryMode}
              onImportData={importBundledData}
              onOpenPlanPage={() => setActivePage("plan")}
              readiness={readiness}
              savedSettings={settings}
              saveState={saveState}
              settingsDraft={settingsDraft}
              onSaveCard={saveSettingsCard}
              onSettingsDraftChange={updateSettingsDraft}
            />
          ) : null}

          {activePage === "plan" ? (
            <PlanPage
              managedApiConfigured={managedApiConfigured}
              managedBusy={managedBusy}
              managedError={managedError}
              managedOtpState={managedOtpState}
              onCancelManagedOtp={() => setManagedOtpState(null)}
              onChangeDeliveryMode={changeDeliveryMode}
              onOpenManagedCheckout={openManagedCheckout}
              onOpenManagedPortal={openManagedPortal}
              onRefreshManagedAccount={refreshManagedAccount}
              onSignOutManagedAccount={signOutManagedAccount}
              onStartManagedSignup={startManagedSignup}
              onVerifyManagedOtp={verifyManagedOtp}
              settingsDraft={settingsDraft}
            />
          ) : null}

          {activePage === "domains" ? (
            <DomainTrackingPage
              domainFilter={domainFilter}
              domainSearch={domainSearch}
              domainError={domainError}
              eventCountsByRule={eventCountsByRule}
              filteredRules={filteredRules}
              newDomain={newDomain}
              removedRuleUndo={removedRuleUndo}
              onAddRule={addRule}
              onDomainFilterChange={setDomainFilter}
              onNewDomainChange={(domain) => {
                setNewDomain(domain);
                setDomainError("");
              }}
              onRemoveRule={removeRule}
              onSearchChange={setDomainSearch}
              onToggleRule={toggleRule}
              onUndoRemoveRule={undoRemoveRule}
            />
          ) : null}

          {activePage === "logs" ? (
            <LogsPage
              events={filteredEvents}
              logFilter={logFilter}
              logSearch={logSearch}
              rulesById={rulesById}
              onFilterChange={setLogFilter}
              onRefresh={refresh}
              onSearchChange={setLogSearch}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function OnboardingPage({
  busy,
  error,
  managedApiConfigured,
  onCompleteByok,
  onCancelManagedOtp,
  onStartManagedSignup,
  onVerifyManagedOtp,
  otpState,
}: {
  busy: boolean;
  error: string;
  managedApiConfigured: boolean;
  onCompleteByok: (phoneNumber: string) => Promise<void>;
  onCancelManagedOtp: () => void;
  onStartManagedSignup: (phoneNumber: string) => Promise<void>;
  onVerifyManagedOtp: (code: string) => Promise<void>;
  otpState: ManagedOtpState;
}) {
  const [step, setStep] = useState<"byok-phone" | "managed">(
    managedApiConfigured ? "managed" : "byok-phone",
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState("");
  const stepCopy = getOnboardingStepCopy(step, otpState);
  const inlinePhoneError = phoneNumber.trim()
    ? validatePhoneNumber(phoneNumber, "Recipient number")
    : "";
  const byokError = localError || inlinePhoneError || "";

  function completeByokFromPhone() {
    const validation = validatePhoneNumber(phoneNumber, "Recipient number");
    if (validation) {
      setLocalError(validation);
      return;
    }
    void onCompleteByok(formatPhoneNumberE164(phoneNumber));
  }

  return (
    <main className="onboardingShell">
      <section className="onboardingPanel" aria-labelledby="onboarding-title">
        <div className="onboardingIntro">
          <h1 id="onboarding-title">{stepCopy.title}</h1>
          <p>{stepCopy.description}</p>
        </div>

        {step === "byok-phone" ? (
          <form
            className="onboardingForm"
            onSubmit={(event) => {
              event.preventDefault();
              completeByokFromPhone();
            }}
          >
            <Field label="Recipient number">
              <input
                className="monoInput"
                aria-invalid={localError ? "true" : undefined}
                value={phoneNumber}
                autoComplete="tel"
                inputMode="tel"
                placeholder="+1 (555) 000-0000"
                onChange={(event) => {
                  setPhoneNumber(event.currentTarget.value);
                  setLocalError("");
                }}
              />
              <FieldError message={byokError} />
            </Field>
            <div className="onboardingActions">
              {managedApiConfigured ? (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => setStep("managed")}
                >
                  Use Swan Managed
                </button>
              ) : null}
              <button
                type="submit"
                className="primaryButton"
              >
                <span>Continue to dashboard</span>
              </button>
            </div>
          </form>
        ) : null}

        {step === "managed" ? (
          <div className="onboardingForm">
            <ManagedAuthForm
              busy={busy}
              error={error}
              initialPhoneNumber=""
              otpState={otpState}
              onBackToMode={() => setStep("byok-phone")}
              onCancelOtp={onCancelManagedOtp}
              showHeader={false}
              onStartSignup={onStartManagedSignup}
              onVerifyOtp={onVerifyManagedOtp}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getOnboardingStepCopy(
  step: "byok-phone" | "managed",
  otpState: ManagedOtpState,
): {
  title: string;
  description: string;
} {
  if (step === "byok-phone") {
    return {
      title: "Enter the number to call.",
      description: "Used when a watched site opens.",
    };
  }

  if (otpState) {
    return {
      title: "Enter your code.",
      description: "Check your text message.",
    };
  }

  return {
    title: "Use Swan Managed",
    description: "Verify your phone number, then start your subscription to enable hosted calls.",
  };
}

function StatusPage({
  bootstrapInfo,
  fieldErrors,
  importingData,
  managedApiConfigured,
  onChangeDeliveryMode,
  onImportData,
  onOpenPlanPage,
  onSaveCard,
  onSettingsDraftChange,
  readiness,
  savedSettings,
  saveState,
  settingsDraft,
}: {
  bootstrapInfo: BootstrapInfo;
  fieldErrors: SettingsFieldErrors;
  importingData: boolean;
  managedApiConfigured: boolean;
  onChangeDeliveryMode: (deliveryMode: DeliveryMode) => Promise<void>;
  onImportData: () => Promise<void>;
  onOpenPlanPage: () => void;
  onSaveCard: (
    cardId: SettingsCardId,
    validateDelivery?: boolean,
  ) => Promise<boolean>;
  onSettingsDraftChange: (cardId: SettingsCardId, settings: UserSettings) => void;
  readiness: ReadinessState;
  savedSettings: UserSettings;
  saveState: Record<SettingsCardId, SaveState>;
  settingsDraft: UserSettings;
}) {
  const localControlsDirty =
    savedSettings.enabled !== settingsDraft.enabled ||
    savedSettings.callEnabled !== settingsDraft.callEnabled;
  const recipientDirty = savedSettings.phoneNumber !== settingsDraft.phoneNumber;
  const elevenLabsDirty = isSettingsCardDirty(
    savedSettings,
    settingsDraft,
    "elevenLabs",
  );
  const importDisabled = importingData || bootstrapInfo.state !== "available";
  const importTitle = getImportButtonTitle(bootstrapInfo);

  return (
    <>
      <PageHeader
        eyebrow="Status"
        title="Protection status"
        description="Readiness, monitoring, and call setup."
      >
        <DeliveryModeToggle
          deliveryMode={settingsDraft.deliveryMode}
          managedApiConfigured={managedApiConfigured}
          onChangeDeliveryMode={onChangeDeliveryMode}
        />
      </PageHeader>

      <ReadinessStrip readiness={readiness} />

      <section className="setupLayout" aria-label="Swan status and delivery">
        <div className="setupColumn">
          <SettingsCard icon={PhoneCall} title="Monitoring" tone="primary">
            <div className="phoneSettingsToggles">
              <ToggleRow
                title="Voice calls"
                description="Call when Swan intervenes"
                checked={settingsDraft.callEnabled}
                onChange={(checked) =>
                  onSettingsDraftChange("phone", {
                    ...settingsDraft,
                    callEnabled: checked,
                  })
                }
              />
              <ToggleRow
                title="Monitoring"
                description="Watch enabled domains"
                checked={settingsDraft.enabled}
                onChange={(checked) =>
                  onSettingsDraftChange("phone", {
                    ...settingsDraft,
                    enabled: checked,
                  })
                }
              />
            </div>
            <SaveCardFooter
              dirty={localControlsDirty}
              state={saveState.phone}
              onSave={() => void onSaveCard("phone")}
            />
          </SettingsCard>
        </div>

        <div className="setupColumn">
          {settingsDraft.deliveryMode === "byok" ? (
            <SettingsCard icon={AudioLines} title="BYOK calls" tag="Local">
              <Field label="Recipient number">
                <input
                  className="monoInput"
                  aria-invalid={fieldErrors.phoneNumber ? "true" : undefined}
                  value={settingsDraft.phoneNumber}
                  placeholder="+1 (555) 000-0000"
                  onChange={(event) =>
                    onSettingsDraftChange("phone", {
                      ...settingsDraft,
                      phoneNumber: event.currentTarget.value,
                    })
                  }
                />
                <FieldError message={fieldErrors.phoneNumber} />
              </Field>
              <Field label="API key">
                <input
                  className="monoInput"
                  aria-invalid={fieldErrors.apiKey ? "true" : undefined}
                  type="password"
                  value={settingsDraft.elevenLabs.apiKey}
                  onChange={(event) =>
                    onSettingsDraftChange("elevenLabs", {
                      ...settingsDraft,
                      elevenLabs: {
                        ...settingsDraft.elevenLabs,
                        apiKey: event.currentTarget.value,
                      },
                    })
                  }
                />
                <FieldError message={fieldErrors.apiKey} />
              </Field>
              <Field label="Agent ID">
                <input
                  className="monoInput"
                  aria-invalid={fieldErrors.agentId ? "true" : undefined}
                  value={settingsDraft.elevenLabs.agentId}
                  onChange={(event) =>
                    onSettingsDraftChange("elevenLabs", {
                      ...settingsDraft,
                      elevenLabs: {
                        ...settingsDraft.elevenLabs,
                        agentId: event.currentTarget.value,
                      },
                    })
                  }
                />
                <FieldError message={fieldErrors.agentId} />
              </Field>
              <Field label="Agent phone number ID">
                <input
                  className="monoInput"
                  aria-invalid={fieldErrors.agentPhoneNumberId ? "true" : undefined}
                  value={settingsDraft.elevenLabs.agentPhoneNumberId}
                  placeholder="phnum_..."
                  onChange={(event) =>
                    onSettingsDraftChange("elevenLabs", {
                      ...settingsDraft,
                      elevenLabs: {
                        ...settingsDraft.elevenLabs,
                        agentPhoneNumberId: event.currentTarget.value,
                      },
                    })
                  }
                />
                <FieldError message={fieldErrors.agentPhoneNumberId} />
              </Field>
              <p className="helperText">
                Your ElevenLabs credentials stay in this browser. Swan hosted
                mode does not use them.
              </p>
              <SaveCardFooter
                dirty={recipientDirty || elevenLabsDirty}
                state={
                  recipientDirty && !elevenLabsDirty
                    ? saveState.phone
                    : saveState.elevenLabs
                }
                onSave={() => {
                  void onSaveCard("phone", true).then((saved) => {
                    if (saved) void onSaveCard("elevenLabs", true);
                  });
                }}
              />
            </SettingsCard>
          ) : (
            <SettingsCard
              icon={CreditCard}
              title="Swan Managed"
              tag={
                settingsDraft.managedAccount
                  ? managedAccountTag(settingsDraft.managedAccount)
                  : "Phone"
              }
            >
              <div className="managedSummary">
                <div>
                  <span>Account</span>
                  <strong>
                    {settingsDraft.managedAccount?.email ||
                      settingsDraft.managedAccount?.phoneNumber ||
                      "Not signed in"}
                  </strong>
                </div>
                <div>
                  <span>Plan</span>
                  <strong>
                    {settingsDraft.managedAccount
                      ? getManagedBillingLabel(settingsDraft.managedAccount)
                      : "Not started"}
                  </strong>
                </div>
              </div>
              <p className="helperText">
                Manage your hosted account and subscription from Plan.
              </p>
              <button
                type="button"
                className="primaryButton"
                onClick={onOpenPlanPage}
              >
                <CreditCard size={14} aria-hidden="true" />
                <span>Open plan settings</span>
              </button>
            </SettingsCard>
          )}
        </div>
      </section>

      {settingsDraft.deliveryMode === "byok" ? (
        <details className="utilityPanel">
          <summary>Import setup file</summary>
          <p>Use this only for a local build that includes config.yaml.</p>
          <button
            type="button"
            className="secondaryButton"
            disabled={importDisabled}
            title={importTitle}
            onClick={() => void onImportData()}
          >
            <Upload size={14} aria-hidden="true" />
            <span>{importingData ? "Importing..." : "Import data"}</span>
          </button>
        </details>
      ) : null}
    </>
  );
}

function ReadinessStrip({ readiness }: { readiness: ReadinessState }) {
  const visibleItems = readiness.items.filter((item) =>
    ["mode", "recipient", "provider", "domains"].includes(item.id),
  );
  const description = getReadinessDescription(readiness);

  return (
    <section
      className={`readinessStrip ${readiness.tone}`}
      aria-label="Setup readiness"
      aria-live="polite"
    >
      <div className="readinessSummary">
        <span>Status</span>
        <div className="readinessTitle">
          <span className="readinessDot" aria-hidden="true" />
          <strong>{readiness.summary}</strong>
        </div>
        <p>{description}</p>
      </div>
      <div className="readinessItems" aria-label="Readiness checks">
        {visibleItems.map((item) => (
          <div className={`readinessItem ${item.tone}`} key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.detail ? <p className="srOnly">{item.detail}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function getReadinessDescription(readiness: ReadinessState): string {
  if (readiness.blockers.length === 0) return "Ready for a test alert.";

  const provider = readiness.items.find((item) => item.id === "provider");
  if (provider?.label === "Provider" && provider.tone === "blocked") {
    return "Configure ElevenLabs.";
  }

  return readiness.blockers[0] ?? "Complete setup.";
}

function DeliveryModeToggle({
  deliveryMode,
  managedApiConfigured,
  onChangeDeliveryMode,
}: {
  deliveryMode: DeliveryMode;
  managedApiConfigured: boolean;
  onChangeDeliveryMode: (deliveryMode: DeliveryMode) => Promise<void>;
}) {
  const description = getDeliveryModeDescription(deliveryMode, managedApiConfigured);

  return (
    <div className="modeHeaderControl" aria-labelledby="delivery-mode-label">
      <span className="modeHeaderLabel" id="delivery-mode-label">
        Call delivery
      </span>
      {managedApiConfigured ? (
        <fieldset className="modeToggle" aria-describedby="delivery-mode-note">
          <legend className="srOnly">Call delivery</legend>
          <ModeToggleOption
            active={deliveryMode === "byok"}
            label="My ElevenLabs"
            value="byok"
            onChange={() => void onChangeDeliveryMode("byok")}
          />
          <ModeToggleOption
            active={deliveryMode === "managed"}
            label="Swan Managed"
            value="managed"
            onChange={() => void onChangeDeliveryMode("managed")}
          />
        </fieldset>
      ) : (
        <div className="modeToggle locked" aria-describedby="delivery-mode-note">
          <span className="modeToggleOption active">My ElevenLabs</span>
        </div>
      )}
      <p className="modeHeaderNote" id="delivery-mode-note">
        {description}
      </p>
    </div>
  );
}

function ModeToggleOption({
  active,
  label,
  onChange,
  value,
}: {
  active: boolean;
  label: string;
  onChange: () => void;
  value: DeliveryMode;
}) {
  return (
    <label className={active ? "modeToggleOption active" : "modeToggleOption"}>
      <input
        type="radio"
        name="deliveryMode"
        checked={active}
        value={value}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function getDeliveryModeDescription(
  deliveryMode: DeliveryMode,
  managedApiConfigured: boolean,
): string {
  if (!managedApiConfigured) return "Swan calls are not enabled in this build.";
  if (deliveryMode === "managed") return "Swan handles hosted calls with an active subscription or trial.";
  return "Your provider key stays in this browser.";
}

function PlanPage({
  managedApiConfigured,
  managedBusy,
  managedError,
  managedOtpState,
  onCancelManagedOtp,
  onChangeDeliveryMode,
  onOpenManagedCheckout,
  onOpenManagedPortal,
  onRefreshManagedAccount,
  onSignOutManagedAccount,
  onStartManagedSignup,
  onVerifyManagedOtp,
  settingsDraft,
}: {
  managedApiConfigured: boolean;
  managedBusy: boolean;
  managedError: string;
  managedOtpState: ManagedOtpState;
  onCancelManagedOtp: () => void;
  onChangeDeliveryMode: (deliveryMode: DeliveryMode) => Promise<void>;
  onOpenManagedCheckout: () => Promise<void>;
  onOpenManagedPortal: () => Promise<void>;
  onRefreshManagedAccount: () => Promise<void>;
  onSignOutManagedAccount: () => Promise<void>;
  onStartManagedSignup: (phoneNumber: string) => Promise<void>;
  onVerifyManagedOtp: (code: string) => Promise<void>;
  settingsDraft: UserSettings;
}) {
  const usingManaged = settingsDraft.deliveryMode === "managed";

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Swan Managed"
        description="Hosted call delivery requires an active Stripe subscription or trial."
      />

      <div className="planLayout">
        {!usingManaged ? (
          <SettingsCard icon={AudioLines} title="Free BYOK" tag="Current">
            <div className="managedSummary">
              <div>
                <span>Mode</span>
                <strong>My ElevenLabs</strong>
              </div>
              <div>
                <span>Billing</span>
                <strong>None</strong>
              </div>
              <div>
                <span>Call delivery</span>
                <strong>Local provider key</strong>
              </div>
            </div>
            <p className="helperText">
              BYOK keeps provider setup in this browser. Swan Managed uses hosted
              call delivery with an active subscription or trial.
            </p>
            <button
              type="button"
              className="primaryButton"
              disabled={!managedApiConfigured}
              onClick={() => void onChangeDeliveryMode("managed")}
            >
              <CreditCard size={14} aria-hidden="true" />
              <span>Use Swan Managed</span>
            </button>
            {!managedApiConfigured ? (
              <p className="managedNotice error">
                Swan calls are not available in this build. Rebuild with
                WXT_SWAN_MANAGED_API_BASE_URL.
              </p>
            ) : null}
          </SettingsCard>
        ) : null}

        {usingManaged ? (
          <ManagedAccountCard
            account={settingsDraft.managedAccount}
            busy={managedBusy}
            error={managedError}
            managedApiConfigured={managedApiConfigured}
            otpState={managedOtpState}
            onBackToByok={() => void onChangeDeliveryMode("byok")}
            onCancelOtp={onCancelManagedOtp}
            onOpenCheckout={onOpenManagedCheckout}
            onOpenPortal={onOpenManagedPortal}
            onRefreshAccount={onRefreshManagedAccount}
            onSignOut={onSignOutManagedAccount}
            onStartSignup={onStartManagedSignup}
            onVerifyOtp={onVerifyManagedOtp}
          />
        ) : null}
      </div>
    </>
  );
}

function ManagedAccountCard({
  account,
  busy,
  error,
  managedApiConfigured,
  onBackToByok,
  onCancelOtp,
  onOpenCheckout,
  onOpenPortal,
  onRefreshAccount,
  onSignOut,
  onStartSignup,
  onVerifyOtp,
  otpState,
}: {
  account: ManagedAccount | null;
  busy: boolean;
  error: string;
  managedApiConfigured: boolean;
  onBackToByok: () => void;
  onCancelOtp: () => void;
  onOpenCheckout: () => Promise<void>;
  onOpenPortal: () => Promise<void>;
  onRefreshAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onStartSignup: (phoneNumber: string) => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
  otpState: ManagedOtpState;
}) {
  return (
      <SettingsCard
        icon={CreditCard}
        title="Swan Managed"
        tag={account ? managedAccountTag(account) : "Phone"}
      >
      {!managedApiConfigured ? (
        <p className="managedNotice error">
          Swan calls are not available in this build. Rebuild with
          WXT_SWAN_MANAGED_API_BASE_URL.
        </p>
      ) : null}

      {account ? (
        <>
          <ManagedPlanSummary
            account={account}
            busy={busy || !managedApiConfigured}
            error={error}
            onOpenCheckout={onOpenCheckout}
            onOpenPortal={onOpenPortal}
            onRefreshAccount={onRefreshAccount}
          />
          <div className="profileGrid" aria-label="Swan account profile">
            <div>
              <span>Name</span>
              <strong>{account.name || "Not set"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{account.email || "Not set"}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{account.phoneNumber}</strong>
            </div>
          </div>
          <p className="helperText">
            Swan calls send only event metadata when Swan intervenes. Your domain
            list and BYOK keys stay local.
          </p>
          <div className="managedActions">
            <button
              type="button"
              className="textButton"
              disabled={busy}
              onClick={() => void onSignOut()}
            >
              Sign out
            </button>
          </div>
        </>
      ) : (
        <ManagedAuthForm
          busy={busy || !managedApiConfigured}
          error={error}
          initialPhoneNumber=""
          otpState={otpState}
          onBackToMode={onBackToByok}
          onCancelOtp={onCancelOtp}
          onStartSignup={onStartSignup}
          onVerifyOtp={onVerifyOtp}
        />
      )}
    </SettingsCard>
  );
}

function ManagedPlanSummary({
  account,
  busy,
  error,
  onOpenCheckout,
  onOpenPortal,
  onRefreshAccount,
}: {
  account: ManagedAccount;
  busy: boolean;
  error: string;
  onOpenCheckout: () => Promise<void>;
  onOpenPortal: () => Promise<void>;
  onRefreshAccount: () => Promise<void>;
}) {
  const active = account.entitlementActive && hasManagedSubscription(account);
  const billingButtonLabel = requiresBillingAttention(account.subscriptionStatus)
    ? "Update subscription"
    : "Start subscription";

  return (
    <>
      <div className="managedSummary">
        <div>
          <span>Access</span>
          <strong className={active ? "stateText enabled" : "stateText disabled"}>
            {getManagedAccessLabel(account)}
          </strong>
        </div>
        <div>
          <span>Plan</span>
          <strong>{getManagedBillingLabel(account)}</strong>
        </div>
        <div>
          <span>Hosted calls</span>
          <strong>{active ? "Enabled" : "Locked"}</strong>
        </div>
      </div>
      {error ? <p className="managedNotice error">{error}</p> : null}
      <div className="managedActions">
        {active ? (
          <button
            type="button"
            className="secondaryButton"
            disabled={busy}
            onClick={() => void onOpenPortal()}
          >
            <CreditCard size={14} aria-hidden="true" />
            <span>Billing portal</span>
          </button>
        ) : (
          <button
            type="button"
            className="primaryButton"
            disabled={busy}
            onClick={() => void onOpenCheckout()}
          >
            <CreditCard size={14} aria-hidden="true" />
            <span>{billingButtonLabel}</span>
          </button>
        )}
        <button
          type="button"
          className="secondaryButton"
          disabled={busy}
          onClick={() => void onRefreshAccount()}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Refresh status</span>
        </button>
      </div>
    </>
  );
}

function ManagedAuthForm({
  busy,
  error,
  initialPhoneNumber,
  onBackToMode,
  onCancelOtp,
  showHeader = true,
  onStartSignup,
  onVerifyOtp,
  otpState,
}: {
  busy: boolean;
  error: string;
  initialPhoneNumber: string;
  onBackToMode: () => void;
  onCancelOtp: () => void;
  showHeader?: boolean;
  onStartSignup: (phoneNumber: string) => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
  otpState: ManagedOtpState;
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<ManagedAuthLocalError>(null);
  const normalizedPhone = formatPhoneNumberE164(phoneNumber);
  const otpForCurrentForm = otpState?.phoneNumber === normalizedPhone;
  const phoneError =
    localError?.field === "phone" && !otpForCurrentForm
      ? localError.message
      : "";
  const codeError =
    localError?.field === "code" && otpForCurrentForm
      ? localError.message
      : "";

  function startOtp() {
    const phoneError = validatePhoneNumber(phoneNumber, "Phone number");
    if (phoneError) {
      setLocalError({ field: "phone", message: phoneError });
      return;
    }

    void onStartSignup(normalizedPhone);
  }

  function verifyOtp() {
    if (!/^\d{4,8}$/.test(code.trim())) {
      setLocalError({
        field: "code",
        message: "Enter the numeric verification code.",
      });
      return;
    }
    void onVerifyOtp(code.trim());
  }

  if (otpForCurrentForm) {
    return (
      <ManagedVerificationStep
        busy={busy}
        code={code}
        codeError={codeError}
        error={error}
        phoneNumber={normalizedPhone}
        onBack={() => {
          onCancelOtp();
          setCode("");
          setLocalError(null);
        }}
        onChangeCode={(nextCode) => {
          setCode(nextCode);
          setLocalError(null);
        }}
        onUseByok={onBackToMode}
        onVerify={verifyOtp}
        showHeader={showHeader}
      />
    );
  }

  return (
    <form
      className="managedAuthForm"
      onSubmit={(event) => {
        event.preventDefault();
        startOtp();
      }}
    >
      {showHeader ? (
        <div className="authModeHeader">
          <h2>Enter your phone number</h2>
          <p>Swan will text a verification code before checkout.</p>
        </div>
      ) : null}

      <Field label="Phone number">
        <input
          className="monoInput"
          name="managed-phone"
          aria-invalid={phoneError ? "true" : undefined}
          value={phoneNumber}
          disabled={busy}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 (555) 000-0000"
          onChange={(event) => {
            setPhoneNumber(event.currentTarget.value);
            setCode("");
            setLocalError(null);
          }}
        />
        <FieldError message={phoneError} />
      </Field>

      <button
        type="submit"
        className="primaryButton"
        disabled={busy || normalizedPhone.length === 0}
      >
        <span>
          {busy ? "Sending..." : "Send verification code"}
        </span>
      </button>

      {showHeader ? (
        <p className="helperText">
          Create or sign in to your Swan Managed account. An active subscription or trial is required before hosted calls start.
        </p>
      ) : null}
      {error ? <p className="managedNotice error">{error}</p> : null}
      <button
        type="button"
        className="textButton authByokLink"
        disabled={busy}
        onClick={onBackToMode}
      >
        Use my ElevenLabs instead
      </button>
    </form>
  );
}

function ManagedVerificationStep({
  busy,
  code,
  codeError,
  error,
  phoneNumber,
  onBack,
  onChangeCode,
  onUseByok,
  onVerify,
  showHeader,
}: {
  busy: boolean;
  code: string;
  codeError: string;
  error: string;
  phoneNumber: string;
  onBack: () => void;
  onChangeCode: (code: string) => void;
  onUseByok: () => void;
  onVerify: () => void;
  showHeader: boolean;
}) {
  return (
    <form
      className="managedAuthForm verificationForm"
      onSubmit={(event) => {
        event.preventDefault();
        onVerify();
      }}
    >
      {showHeader ? (
        <div className="authModeHeader centered">
          <h2>Check your texts</h2>
          <p>Code sent to {phoneNumber}.</p>
        </div>
      ) : null}
      <Field label="Verification code">
        <input
          className="monoInput codeInput"
          name="managed-verification-code"
          aria-invalid={codeError ? "true" : undefined}
          value={code}
          disabled={busy}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={8}
          placeholder="000000"
          onChange={(event) => onChangeCode(event.currentTarget.value)}
        />
        <FieldError message={codeError} />
      </Field>
      {error ? <p className="managedNotice error">{error}</p> : null}
      <div className="onboardingActions">
        <button
          type="button"
          className="secondaryButton"
          disabled={busy}
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="submit"
          className="primaryButton"
          disabled={busy || code.trim().length === 0}
        >
          <span>{busy ? "Verifying..." : "Verify code"}</span>
        </button>
      </div>
      <button
        type="button"
        className="textButton authByokLink"
        disabled={busy}
        onClick={onUseByok}
      >
        Use my ElevenLabs instead
      </button>
    </form>
  );
}

function DomainTrackingPage({
  domainError,
  domainFilter,
  domainSearch,
  eventCountsByRule,
  filteredRules,
  newDomain,
  onAddRule,
  onDomainFilterChange,
  onNewDomainChange,
  onRemoveRule,
  onSearchChange,
  onToggleRule,
  onUndoRemoveRule,
  removedRuleUndo,
}: {
  domainError: string;
  domainFilter: DomainFilter;
  domainSearch: string;
  eventCountsByRule: Map<string, number>;
  filteredRules: DetectionRule[];
  newDomain: string;
  onAddRule: () => Promise<void>;
  onDomainFilterChange: (filter: DomainFilter) => void;
  onNewDomainChange: (domain: string) => void;
  onRemoveRule: (ruleId: string) => Promise<void>;
  onSearchChange: (query: string) => void;
  onToggleRule: (ruleId: string) => Promise<void>;
  onUndoRemoveRule: () => Promise<void>;
  removedRuleUndo: RemovedRuleUndo;
}) {
  const domainFilters: Array<{ label: string; value: DomainFilter }> = [
    { label: "All", value: "all" },
    { label: "Enabled", value: "enabled" },
    { label: "Disabled", value: "disabled" },
    { label: "Custom", value: "user" },
    { label: "Built-in", value: "seed" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Domains"
        title="Watched domains"
        description="Swan watches enabled domains and their subdomains."
      />

      <section className="dataPanel" aria-labelledby="tracked-domains">
        <div className="panelHeader">
          <div className="titleWithIcon">
            <Globe2 size={18} aria-hidden="true" />
            <h2 id="tracked-domains">Domain list</h2>
          </div>
        </div>

        <div className="panelBody">
          <div className="domainForm">
            <Field label="Domain">
              <input
                className="monoInput"
                aria-invalid={domainError ? "true" : undefined}
                value={newDomain}
                placeholder="domain.com"
                onChange={(event) => onNewDomainChange(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void onAddRule();
                }}
              />
              <FieldError message={domainError} />
            </Field>
            <button
              type="button"
              className="secondaryButton"
              onClick={() => void onAddRule()}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Add domain</span>
            </button>
          </div>

          <div className="filterBar">
            <label className="searchBox">
              <Search size={15} aria-hidden="true" />
              <span className="srOnly">Search domains</span>
              <input
                value={domainSearch}
                placeholder="Search domains"
                onChange={(event) => onSearchChange(event.currentTarget.value)}
              />
            </label>
            <div className="filterChips" aria-label="Domain filters">
              {domainFilters.map((filter) => (
                <FilterButton
                  active={domainFilter === filter.value}
                  key={filter.value}
                  label={filter.label}
                  onClick={() => onDomainFilterChange(filter.value)}
                />
              ))}
            </div>
          </div>

          <p className="domainNote">
            Add the root domain only. Swan matches subdomains automatically.
          </p>
          {removedRuleUndo ? (
            <div className="undoNotice" aria-live="polite">
              <span>Removed {removedRuleUndo.rule.domain}.</span>
              <button
                type="button"
                className="textButton"
                onClick={() => void onUndoRemoveRule()}
              >
                Undo
              </button>
            </div>
          ) : null}
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th>Detections</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td className="emptyState" colSpan={6}>
                    No domains match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="domainName">{rule.domain}</td>
                    <td>
                      <span className={`sourceChip ${rule.source}`}>
                        {rule.source}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          rule.enabled ? "stateText enabled" : "stateText disabled"
                        }
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>{formatDate(rule.createdAt)}</td>
                    <td>{eventCountsByRule.get(rule.id) ?? 0}</td>
                    <td className="rightCell">
                      <div className="rowActions end">
                        <Switch
                          checked={rule.enabled}
                          label={`${rule.enabled ? "Disable" : "Enable"} ${
                            rule.domain
                          }`}
                          onChange={() => void onToggleRule(rule.id)}
                        />
                        <button
                          type="button"
                          className="dangerIconButton"
                          aria-label={`Remove ${rule.domain}`}
                          onClick={() => void onRemoveRule(rule.id)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LogsPage({
  events,
  logFilter,
  logSearch,
  onFilterChange,
  onRefresh,
  onSearchChange,
  rulesById,
}: {
  events: UrgeEvent[];
  logFilter: LogFilter;
  logSearch: string;
  onFilterChange: (filter: LogFilter) => void;
  onRefresh: () => Promise<void>;
  onSearchChange: (query: string) => void;
  rulesById: Map<string, DetectionRule>;
}) {
  const logFilters: Array<{ label: string; value: LogFilter }> = [
    { label: "All", value: "all" },
    { label: "Accepted", value: "accepted" },
    { label: "Success", value: "success" },
    { label: "Failed", value: "failed" },
    { label: "Skipped", value: "skipped" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Event history"
        description="Review detections and call results stored in this browser."
      >
        <button
          type="button"
          className="secondaryButton"
          onClick={() => void onRefresh()}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </PageHeader>

      <section className="dataPanel" aria-labelledby="detection-logs">
        <div className="panelHeader">
          <div className="titleWithIcon">
            <List size={18} aria-hidden="true" />
            <h2 id="detection-logs">Events</h2>
          </div>
        </div>

        <div className="panelBody">
          <div className="filterBar">
            <label className="searchBox">
              <Search size={15} aria-hidden="true" />
              <span className="srOnly">Search history</span>
              <input
                value={logSearch}
                placeholder="Search by domain"
                onChange={(event) => onSearchChange(event.currentTarget.value)}
              />
            </label>
            <div className="filterChips" aria-label="History filters">
              {logFilters.map((filter) => (
                <FilterButton
                  active={logFilter === filter.value}
                  key={filter.value}
                  label={filter.label}
                  onClick={() => onFilterChange(filter.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tableWrap">
          <table className="logsTable">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Timestamp</th>
                <th>Rule</th>
                <th>Call</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="emptyState" colSpan={4}>
                    Events appear after a test alert or detected watched domain.
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const rule = rulesById.get(event.ruleId);
                  return (
                    <tr key={event.id}>
                      <td className="domainName" data-label="Domain">
                        {event.domain}
                      </td>
                      <td data-label="Timestamp">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td data-label="Rule">
                        <div className="ruleCell">
                          <span className="domainName">
                            {rule?.id ?? event.ruleId}
                          </span>
                          {rule ? (
                            <span className={`sourceChip ${rule.source}`}>
                              {rule.source}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="Call">
                        <StatusCell status={event.callStatus} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PageHeader({
  children,
  description,
  eyebrow,
  title,
}: {
  children?: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="pageHeader">
      <div>
        <span className="pageHeaderEyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="pageHeaderActions">{children}</div> : null}
    </section>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={active ? "filterChip active" : "filterChip"}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SaveCardFooter({
  dirty,
  onSave,
  state,
}: {
  dirty: boolean;
  onSave: () => void;
  state: SaveState;
}) {
  const saving = state === "saving";
  const saved = state === "saved" && !dirty;
  const status = dirty ? "Unsaved changes" : saved ? "Saved" : "Saved";

  return (
    <div className="cardFooter">
      <span className={dirty ? "saveState dirty" : "saveState"}>{status}</span>
      <button
        type="button"
        className="secondaryButton"
        disabled={saving || !dirty}
        onClick={onSave}
      >
        <CheckCircle2 size={14} aria-hidden="true" />
        <span>{saving ? "Saving..." : "Save"}</span>
      </button>
    </div>
  );
}

function SettingsCard({
  children,
  icon: Icon,
  tag,
  tone,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  tag?: string;
  tone?: "primary";
  title: string;
}) {
  return (
    <section
      className={
        tone === "primary" ? "settingsCard primarySettingsCard" : "settingsCard"
      }
    >
      <div className="cardHeader">
        <div className="titleWithIcon">
          <Icon size={18} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        {tag ? <span className="tagChip">{tag}</span> : null}
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p className="fieldError" role="alert">
      {message}
    </p>
  );
}

function ToggleRow({
  checked,
  description,
  onChange,
  title,
}: {
  checked: boolean;
  description: string;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <div className="toggleRow">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Switch
        checked={checked}
        label={title}
        onChange={(nextChecked) => onChange(nextChecked)}
      />
    </div>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch">
      <span className="srOnly">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="switchTrack" aria-hidden="true" />
    </label>
  );
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <div className={enabled ? "statusPill on" : "statusPill off"}>
      <span />
      <strong>{enabled ? "Monitoring On" : "Monitoring Off"}</strong>
    </div>
  );
}

function StatusLabel({ status }: { status: AlertStatus }) {
  const Icon = getStatusIcon(status.state);
  return (
    <span className={`statusLabel ${status.state}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{formatStatus(status)}</span>
    </span>
  );
}

function StatusCell({ status }: { status: AlertStatus }) {
  const detail = formatStatusDetail(status);
  return (
    <div className="statusCell">
      <StatusLabel status={status} />
      {detail ? <span className="statusDetail">{detail}</span> : null}
    </div>
  );
}

function getStatusIcon(state: AlertStatus["state"]): LucideIcon {
  if (state === "success") return CheckCircle2;
  if (state === "accepted") return Clock;
  if (state === "failed") return CircleAlert;
  if (state === "skipped") return Ban;
  return Clock;
}

function formatStatus(status: AlertStatus): string {
  if (status.state === "success") return "Success";
  if (status.state === "accepted") return "Accepted";
  if (status.state === "failed") return "Failed";
  if (status.state === "skipped") return "Skipped";
  return "Pending";
}

function formatStatusDetail(status: AlertStatus): string {
  if (status.state === "success") return status.providerId ?? "";
  if (status.state === "accepted") return status.providerId ?? "";
  if (status.state === "failed") return status.error;
  if (status.state === "skipped") return status.reason;
  return "";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

function getImportButtonTitle(info: BootstrapInfo): string {
  if (info.state === "checking") return "Checking bundled config...";
  if (info.state === "missing") {
    return "No bundled config found. Add config.yaml and rebuild Swan.";
  }
  if (info.state === "error") return info.error;
  return "Import bundled config.yaml data.";
}

function createManagedClient(): ManagedClient {
  return new ManagedClient();
}

function formatManagedError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Swan request failed.";
}

function hasManagedSubscription(account: ManagedAccount): boolean {
  return (
    account.subscriptionStatus === "active" ||
    account.subscriptionStatus === "trialing"
  );
}

function managedAccountTag(account: ManagedAccount): string {
  if (account.entitlementActive && hasManagedSubscription(account)) return "Active";
  if (requiresBillingAttention(account.subscriptionStatus)) return "Needs attention";
  return "Subscription required";
}

function getManagedAccessLabel(account: ManagedAccount): string {
  if (account.entitlementActive && hasManagedSubscription(account)) return "Active";
  if (requiresBillingAttention(account.subscriptionStatus)) return "Needs attention";
  return "Subscription required";
}

function getManagedBillingLabel(account: ManagedAccount): string {
  const status = account.subscriptionStatus;
  if (!status) return "Not started";
  if (status === "trialing") return "Trial active";
  if (status === "active") return "Current";
  if (requiresBillingAttention(status)) return "Needs attention";
  if (status === "canceled" || status === "incomplete_expired") return "Ended";
  return formatSubscriptionStatus(status);
}

function requiresBillingAttention(status: string | null): boolean {
  return (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "paused"
  );
}

function formatSubscriptionStatus(status: string): string {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getCardFieldErrors(
  settings: UserSettings,
  cardId: SettingsCardId,
  validateDelivery: boolean,
): SettingsFieldErrors {
  const errors: SettingsFieldErrors = {};

  if (!validateDelivery || settings.deliveryMode !== "byok") {
    return errors;
  }

  const deliveryErrors = getSettingsFieldErrors(settings);
  if (cardId === "phone") {
    if (deliveryErrors.phoneNumber) errors.phoneNumber = deliveryErrors.phoneNumber;
    return errors;
  }

  if (deliveryErrors.apiKey) errors.apiKey = deliveryErrors.apiKey;
  if (deliveryErrors.agentId) errors.agentId = deliveryErrors.agentId;
  if (deliveryErrors.agentPhoneNumberId) {
    errors.agentPhoneNumberId = deliveryErrors.agentPhoneNumberId;
  }
  return errors;
}

function isSettingsCardDirty(
  saved: UserSettings,
  draft: UserSettings,
  cardId: SettingsCardId,
): boolean {
  if (cardId === "phone") {
    return (
      saved.enabled !== draft.enabled ||
      saved.phoneNumber !== draft.phoneNumber ||
      saved.callEnabled !== draft.callEnabled
    );
  }

  return (
    saved.elevenLabs.apiKey !== draft.elevenLabs.apiKey ||
    saved.elevenLabs.agentId !== draft.elevenLabs.agentId ||
    saved.elevenLabs.agentPhoneNumberId !==
      draft.elevenLabs.agentPhoneNumberId
  );
}

function mergeSettingsCard(
  saved: UserSettings,
  draft: UserSettings,
  cardId: SettingsCardId,
): UserSettings {
  if (cardId === "phone") {
    return {
      ...saved,
      enabled: draft.enabled,
      phoneNumber: draft.phoneNumber,
      callEnabled: draft.callEnabled,
    };
  }

  return { ...saved, elevenLabs: draft.elevenLabs };
}

async function fetchBundledBootstrap(): Promise<SwanBootstrap | null> {
  const response = await fetch("/swan-bootstrap.json", {
    cache: "no-store",
  });
  if (!response.ok) return null;
  return parseSwanBootstrap(await response.json());
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
