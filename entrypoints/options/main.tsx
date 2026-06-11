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
  Globe2,
  List,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
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
import {
  getManagedApiBaseUrl,
  ManagedApiError,
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

type ActivePage = "general" | "domains" | "logs";
type DomainFilter = "all" | "enabled" | "disabled" | "user" | "seed";
type LogFilter = "all" | AlertStatus["state"];
type SettingsCardId = "phone" | "elevenLabs";
type SaveState = "idle" | "saving" | "saved";
type ManagedOtpState = { challengeId: string; phoneNumber: string } | null;
type RemovedRuleUndo = { rule: DetectionRule; index: number } | null;
type BootstrapInfo =
  | { state: "checking" }
  | { state: "missing" }
  | { state: "available"; bootstrap: SwanBootstrap; summary: BootstrapSummary }
  | { state: "error"; error: string };

const navItems: Array<{ id: ActivePage; label: string; icon: LucideIcon }> = [
  { id: "general", label: "Status", icon: Settings },
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
    const [nextSettings, nextRules, nextEvents] = await Promise.all([
      getSettings(),
      getRules(),
      getEvents(),
    ]);
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

    const nextSettings = { ...settings, ...settingsDraft, deliveryMode };
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setSaveState({ phone: "idle", elevenLabs: "idle" });
    setNotice(
      deliveryMode === "managed"
        ? "Managed calls selected. Sign in to continue."
        : "BYOK selected. Swan will use your local ElevenLabs settings.",
    );
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

  async function startManagedOtp(phoneNumber: string) {
    if (!settings || !settingsDraft) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const response = await client.startOtp(phoneNumber);
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
    if (!settings || !settingsDraft || !managedOtpState) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const auth = await client.verifyOtp({
        challengeId: managedOtpState.challengeId,
        code,
      });
      const managedAccount = await client.fetchMe(auth.account);
      const nextSettings = {
        ...settings,
        ...settingsDraft,
        deliveryMode: "managed" as const,
        managedAccount,
      };
      await saveSettings(nextSettings);
      setSettings(nextSettings);
      setSettingsDraft(nextSettings);
      setManagedOtpState(null);
      setNotice("Signed in for managed calls.");
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
      setNotice("Managed status refreshed.");
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function startManagedSubscription() {
    if (!settings?.managedAccount) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      const response = await client.createCheckout(settings.managedAccount);
      await browser.tabs.create({ url: response.checkoutUrl });
    } catch (error) {
      setManagedError(formatManagedError(error));
    } finally {
      setManagedBusy(false);
    }
  }

  async function manageManagedSubscription() {
    if (!settings?.managedAccount) return;

    setManagedBusy(true);
    setManagedError("");
    try {
      const client = createManagedClient();
      try {
        const response = await client.createPortal(settings.managedAccount);
        await browser.tabs.create({ url: response.portalUrl });
      } catch (error) {
        if (!(error instanceof ManagedApiError) || error.status !== 404) {
          throw error;
        }
        const response = await client.createCheckout(settings.managedAccount);
        await browser.tabs.create({ url: response.checkoutUrl });
      }
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
      setNotice("Signed out of managed calls on this browser.");
    }
  }

  async function updateManagedAccount(managedAccount: ManagedAccount) {
    if (!settings || !settingsDraft) return;

    const nextSettings = {
      ...settings,
      ...settingsDraft,
      managedAccount,
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

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Swan settings navigation">
        <div className="brandBlock">
          <div className="brandMark">
            <h1>Swan settings</h1>
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
        </header>

        <div className="content">
          {notice ? <p className="notice">{notice}</p> : null}

          {activePage === "general" ? (
            <GeneralPage
              bootstrapInfo={bootstrapInfo}
              importingData={importingData}
              managedApiConfigured={managedApiConfigured}
              managedBusy={managedBusy}
              managedError={managedError}
              managedOtpState={managedOtpState}
              onChangeDeliveryMode={changeDeliveryMode}
              readiness={readiness}
              savedSettings={settings}
              saveState={saveState}
              fieldErrors={fieldErrors}
              settingsDraft={settingsDraft}
              onManageManagedSubscription={manageManagedSubscription}
              onImportData={importBundledData}
              onRefreshManagedAccount={refreshManagedAccount}
              onSaveCard={saveSettingsCard}
              onSettingsDraftChange={updateSettingsDraft}
              onSignOutManagedAccount={signOutManagedAccount}
              onStartManagedOtp={startManagedOtp}
              onStartManagedSubscription={startManagedSubscription}
              onVerifyManagedOtp={verifyManagedOtp}
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

function GeneralPage({
  bootstrapInfo,
  fieldErrors,
  importingData,
  managedApiConfigured,
  managedBusy,
  managedError,
  managedOtpState,
  onChangeDeliveryMode,
  onImportData,
  onManageManagedSubscription,
  onRefreshManagedAccount,
  onSaveCard,
  onSettingsDraftChange,
  onSignOutManagedAccount,
  onStartManagedOtp,
  onStartManagedSubscription,
  onVerifyManagedOtp,
  readiness,
  savedSettings,
  saveState,
  settingsDraft,
}: {
  bootstrapInfo: BootstrapInfo;
  fieldErrors: SettingsFieldErrors;
  importingData: boolean;
  managedApiConfigured: boolean;
  managedBusy: boolean;
  managedError: string;
  managedOtpState: ManagedOtpState;
  onChangeDeliveryMode: (deliveryMode: DeliveryMode) => Promise<void>;
  onImportData: () => Promise<void>;
  onManageManagedSubscription: () => Promise<void>;
  onRefreshManagedAccount: () => Promise<void>;
  onSaveCard: (
    cardId: SettingsCardId,
    validateDelivery?: boolean,
  ) => Promise<boolean>;
  onSettingsDraftChange: (cardId: SettingsCardId, settings: UserSettings) => void;
  onSignOutManagedAccount: () => Promise<void>;
  onStartManagedOtp: (phoneNumber: string) => Promise<void>;
  onStartManagedSubscription: () => Promise<void>;
  onVerifyManagedOtp: (code: string) => Promise<void>;
  readiness: ReadinessState;
  savedSettings: UserSettings;
  saveState: Record<SettingsCardId, SaveState>;
  settingsDraft: UserSettings;
}) {
  const phoneDirty = isSettingsCardDirty(savedSettings, settingsDraft, "phone");
  const localControlsDirty =
    savedSettings.enabled !== settingsDraft.enabled ||
    savedSettings.callEnabled !== settingsDraft.callEnabled;
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
        title="Intervention setup"
        description="Choose how Swan calls you, then keep monitoring on."
      />

      <ReadinessStrip readiness={readiness} />

      <section className="setupLayout" aria-label="Swan configuration">
        <div className="setupColumn">
          <DeliveryModePanel
            deliveryMode={settingsDraft.deliveryMode}
            onChangeDeliveryMode={onChangeDeliveryMode}
          />

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
                Your ElevenLabs credentials stay in this browser. Managed mode
                does not use them.
              </p>
              <SaveCardFooter
                dirty={phoneDirty || elevenLabsDirty}
                state={
                  phoneDirty && !elevenLabsDirty
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
            <ManagedAccountCard
              account={settingsDraft.managedAccount}
              busy={managedBusy}
              error={managedError}
              managedApiConfigured={managedApiConfigured}
              otpState={managedOtpState}
              onManageSubscription={onManageManagedSubscription}
              onRefreshAccount={onRefreshManagedAccount}
              onSignOut={onSignOutManagedAccount}
              onStartOtp={onStartManagedOtp}
              onStartSubscription={onStartManagedSubscription}
              onVerifyOtp={onVerifyManagedOtp}
            />
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

function DeliveryModePanel({
  deliveryMode,
  onChangeDeliveryMode,
}: {
  deliveryMode: DeliveryMode;
  onChangeDeliveryMode: (deliveryMode: DeliveryMode) => Promise<void>;
}) {
  return (
    <section className="deliveryPanel" aria-labelledby="delivery-mode">
      <div className="deliveryPanelHeader">
        <div>
          <h2 id="delivery-mode">Delivery mode</h2>
          <p>
            Choose who places intervention calls. Domains and history stay local.
          </p>
        </div>
      </div>
      <fieldset className="modeOptions" aria-label="Delivery mode">
        <legend className="srOnly">Delivery mode</legend>
        <ModeOption
          active={deliveryMode === "byok"}
          value="byok"
          description="Use your ElevenLabs account. Credentials stay in this browser."
          label="Use my keys"
          onChange={() => void onChangeDeliveryMode("byok")}
        />
        <ModeOption
          active={deliveryMode === "managed"}
          value="managed"
          description="Sign in and let Swan place calls for this browser."
          label="Use managed calls"
          onChange={() => void onChangeDeliveryMode("managed")}
        />
      </fieldset>
    </section>
  );
}

function ModeOption({
  active,
  description,
  label,
  onChange,
  value,
}: {
  active: boolean;
  description: string;
  label: string;
  onChange: () => void;
  value: DeliveryMode;
}) {
  return (
    <label
      className={active ? "modeOption active" : "modeOption"}
    >
      <input
        type="radio"
        name="deliveryMode"
        checked={active}
        value={value}
        onChange={onChange}
      />
      <span className="modeOptionTop">
        <strong>{label}</strong>
      </span>
      <span>{description}</span>
    </label>
  );
}

function ManagedAccountCard({
  account,
  busy,
  error,
  managedApiConfigured,
  onManageSubscription,
  onRefreshAccount,
  onSignOut,
  onStartOtp,
  onStartSubscription,
  onVerifyOtp,
  otpState,
}: {
  account: ManagedAccount | null;
  busy: boolean;
  error: string;
  managedApiConfigured: boolean;
  onManageSubscription: () => Promise<void>;
  onRefreshAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onStartOtp: (phoneNumber: string) => Promise<void>;
  onStartSubscription: () => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
  otpState: ManagedOtpState;
}) {
  const [phoneNumber, setPhoneNumber] = useState(account?.phoneNumber ?? "");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const active = Boolean(account?.entitlementActive);

  return (
    <SettingsCard
      icon={CheckCircle2}
      title="Managed calls"
      tag={account ? managedAccountTag(account) : "Sign in"}
    >
      {!managedApiConfigured ? (
        <p className="managedNotice error">
          Managed calls are not available in this build. Rebuild with
          WXT_SWAN_MANAGED_API_BASE_URL.
        </p>
      ) : null}

      {account ? (
        <>
          <div className="managedSummary">
            <div>
              <span>Phone</span>
              <strong>{account.phoneNumber}</strong>
            </div>
            <div>
              <span>Access</span>
              <strong className={active ? "stateText enabled" : "stateText disabled"}>
                {active ? "Active" : "Inactive"}
              </strong>
            </div>
            <div>
              <span>Plan</span>
              <strong>{account.subscriptionStatus ?? "No subscription"}</strong>
            </div>
          </div>
          <p className="helperText">
            Managed calls send only event metadata when Swan intervenes. Your
            domain list and BYOK keys stay local.
          </p>
          {account.currentPeriodEnd ? (
            <p className="domainNote">
              Current period ends {new Date(account.currentPeriodEnd).toLocaleDateString()}.
            </p>
          ) : null}
          {error ? <p className="managedNotice error">{error}</p> : null}
          <div className="managedActions">
            <button
              type="button"
              className="primaryButton"
              disabled={busy}
              onClick={() => void onStartSubscription()}
            >
              <span>{active ? "Update subscription" : "Start subscription"}</span>
            </button>
            <button
              type="button"
              className="secondaryButton"
              disabled={busy}
              onClick={() => void onManageSubscription()}
            >
              <span>Open billing</span>
            </button>
            <button
              type="button"
              className="secondaryButton"
              disabled={busy}
              onClick={() => void onRefreshAccount()}
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Refresh status</span>
            </button>
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
        <>
          <Field label="Managed phone number">
            <input
              className="monoInput"
              aria-invalid={localError ? "true" : undefined}
              value={phoneNumber}
              disabled={!managedApiConfigured || busy}
              placeholder="+1 (555) 000-0000"
              onChange={(event) => {
                setPhoneNumber(event.currentTarget.value);
                setLocalError("");
              }}
            />
            <FieldError message={localError && !otpState ? localError : ""} />
          </Field>
          <button
            type="button"
            className="secondaryButton"
            disabled={!managedApiConfigured || busy || phoneNumber.trim().length === 0}
            onClick={() => {
              const validation = validatePhoneNumber(phoneNumber, "Managed phone number");
              if (validation) {
                setLocalError(validation);
                return;
              }
              void onStartOtp(phoneNumber);
            }}
          >
            <span>{busy && !otpState ? "Sending..." : "Send verification code"}</span>
          </button>
          {otpState ? (
            <>
              <Field label="Verification code">
                <input
                  className="monoInput"
                  aria-invalid={localError ? "true" : undefined}
                  value={code}
                  disabled={busy}
                  inputMode="numeric"
                  placeholder="000000"
                  onChange={(event) => {
                    setCode(event.currentTarget.value);
                    setLocalError("");
                  }}
                />
                <FieldError message={localError && otpState ? localError : ""} />
              </Field>
              <button
                type="button"
                className="primaryButton"
                disabled={busy || code.trim().length === 0}
                onClick={() => {
                  if (!/^\d{4,8}$/.test(code.trim())) {
                    setLocalError("Enter the numeric verification code.");
                    return;
                  }
                  void onVerifyOtp(code);
                }}
              >
                <span>{busy ? "Verifying..." : "Verify and sign in"}</span>
              </button>
            </>
          ) : null}
          <p className="helperText">
            Managed calls use this phone number. BYOK calls keep their own
            recipient.
          </p>
          {error ? <p className="managedNotice error">{error}</p> : null}
        </>
      )}
    </SettingsCard>
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
        <span>{eyebrow}</span>
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
  return "Managed request failed.";
}

function managedAccountTag(account: ManagedAccount): string {
  if (account.entitlementActive) return "Active";
  if (account.subscriptionStatus) return account.subscriptionStatus;
  return "Inactive";
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
