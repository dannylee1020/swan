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
  MessageSquare,
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
import type {
  AlertStatus,
  DetectionRule,
  UrgeEvent,
  UserSettings,
} from "../../lib/types";
import "./style.css";

type ActivePage = "general" | "domains" | "logs";
type DomainFilter = "all" | "enabled" | "disabled" | "user" | "seed";
type LogFilter = "all" | AlertStatus["state"];
type SettingsCardId = "phone" | "twilio" | "elevenLabs";
type SaveState = "idle" | "saving" | "saved";
type BootstrapInfo =
  | { state: "checking" }
  | { state: "missing" }
  | { state: "available"; bootstrap: SwanBootstrap; summary: BootstrapSummary }
  | { state: "error"; error: string };

const navItems: Array<{ id: ActivePage; label: string; icon: LucideIcon }> = [
  { id: "general", label: "General", icon: Settings },
  { id: "domains", label: "Domain Tracking", icon: Globe2 },
  { id: "logs", label: "Logs", icon: List },
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
  const [bootstrapInfo, setBootstrapInfo] = useState<BootstrapInfo>({
    state: "checking",
  });
  const [saveState, setSaveState] = useState<Record<SettingsCardId, SaveState>>({
    phone: "idle",
    twilio: "idle",
    elevenLabs: "idle",
  });

  useEffect(() => {
    void refresh();
    void loadBootstrapInfo();
  }, []);

  const enabledRules = useMemo(
    () => rules.filter((rule) => rule.enabled).length,
    [rules],
  );

  const domainStats = useMemo(
    () => ({
      total: rules.length,
      enabled: enabledRules,
      custom: rules.filter((rule) => rule.source === "user").length,
      seed: rules.filter((rule) => rule.source === "seed").length,
    }),
    [enabledRules, rules],
  );

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

  const logStats = useMemo(
    () => ({
      total: events.length,
      smsSuccess: countChannelStatus(events, "smsStatus", "success"),
      smsFailed: countChannelStatus(events, "smsStatus", "failed"),
      smsSkipped: countChannelStatus(events, "smsStatus", "skipped"),
      callSuccess: countChannelStatus(events, "callStatus", "success"),
      callFailed: countChannelStatus(events, "callStatus", "failed"),
      callSkipped: countChannelStatus(events, "callStatus", "skipped"),
    }),
    [events],
  );

  const rulesById = useMemo(
    () => new Map(rules.map((rule) => [rule.id, rule])),
    [rules],
  );

  const filteredEvents = useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch = !query || event.domain.includes(query);
      const matchesStatus =
        logFilter === "all" ||
        event.smsStatus.state === logFilter ||
        event.callStatus.state === logFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, logFilter, logSearch]);

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
    setSaveState({ phone: "idle", twilio: "idle", elevenLabs: "idle" });
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
    setSaveState((current) => ({ ...current, [cardId]: "idle" }));
  }

  async function saveSettingsCard(cardId: SettingsCardId) {
    if (!settings || !settingsDraft) return;

    setSaveState((current) => ({ ...current, [cardId]: "saving" }));
    const nextSettings = mergeSettingsCard(settings, settingsDraft, cardId);
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft((currentDraft) =>
      currentDraft
        ? mergeSettingsCard(currentDraft, nextSettings, cardId)
        : nextSettings,
    );
    setSaveState((current) => ({ ...current, [cardId]: "saved" }));
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
        ? "Test alert completed. Check Logs for the latest event."
        : response.error,
    );
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
      setSaveState({ phone: "idle", twilio: "idle", elevenLabs: "idle" });
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

  if (!settings || !settingsDraft) {
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
          <a className="navItem" href="../../docs/provider-setup.md">
            <BookOpen size={18} aria-hidden="true" />
            <span>Documentation</span>
          </a>
          <a className="navItem" href="#support">
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
              disabled={testing}
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
              savedSettings={settings}
              saveState={saveState}
              settingsDraft={settingsDraft}
              onImportData={importBundledData}
              onSaveCard={saveSettingsCard}
              onSettingsDraftChange={updateSettingsDraft}
            />
          ) : null}

          {activePage === "domains" ? (
            <DomainTrackingPage
              domainFilter={domainFilter}
              domainSearch={domainSearch}
              eventCountsByRule={eventCountsByRule}
              filteredRules={filteredRules}
              newDomain={newDomain}
              stats={domainStats}
              onAddRule={addRule}
              onDomainFilterChange={setDomainFilter}
              onNewDomainChange={setNewDomain}
              onRemoveRule={removeRule}
              onSearchChange={setDomainSearch}
              onToggleRule={toggleRule}
            />
          ) : null}

          {activePage === "logs" ? (
            <LogsPage
              events={filteredEvents}
              logFilter={logFilter}
              logSearch={logSearch}
              rulesById={rulesById}
              stats={logStats}
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
  importingData,
  onImportData,
  onSaveCard,
  onSettingsDraftChange,
  savedSettings,
  saveState,
  settingsDraft,
}: {
  bootstrapInfo: BootstrapInfo;
  importingData: boolean;
  onImportData: () => Promise<void>;
  onSaveCard: (cardId: SettingsCardId) => Promise<void>;
  onSettingsDraftChange: (cardId: SettingsCardId, settings: UserSettings) => void;
  savedSettings: UserSettings;
  saveState: Record<SettingsCardId, SaveState>;
  settingsDraft: UserSettings;
}) {
  const phoneDirty = isSettingsCardDirty(savedSettings, settingsDraft, "phone");
  const twilioDirty = isSettingsCardDirty(savedSettings, settingsDraft, "twilio");
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
        eyebrow="General"
        title="Intervention settings"
        description="Configure the voice-first intervention Swan uses when a tracked domain is detected."
      >
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
      </PageHeader>

      <section className="settingsGrid" aria-label="Swan configuration">
        <SettingsCard icon={PhoneCall} title="Phone Configuration" tone="primary">
          <div className="phoneSettingsFields">
            <Field label="Recipient number">
              <input
                className="monoInput"
                value={settingsDraft.phoneNumber}
                placeholder="+1 (555) 000-0000"
                onChange={(event) =>
                  onSettingsDraftChange("phone", {
                    ...settingsDraft,
                    phoneNumber: event.currentTarget.value,
                  })
                }
              />
            </Field>
            <Field label="Cooldown minutes">
              <input
                className="monoInput"
                type="number"
                min="1"
                value={settingsDraft.cooldownMinutes}
                onChange={(event) =>
                  onSettingsDraftChange("phone", {
                    ...settingsDraft,
                    cooldownMinutes: Number(event.currentTarget.value),
                  })
                }
              />
            </Field>
          </div>
          <div className="phoneSettingsToggles">
            <ToggleRow
              title="Start voice call"
              description="Standard intervention channel"
              checked={settingsDraft.callEnabled}
              onChange={(checked) =>
                onSettingsDraftChange("phone", {
                  ...settingsDraft,
                  callEnabled: checked,
                })
              }
            />
            <ToggleRow
              title="Enable monitoring"
              description="Watch configured domains in this browser"
              checked={settingsDraft.enabled}
              onChange={(checked) =>
                onSettingsDraftChange("phone", {
                  ...settingsDraft,
                  enabled: checked,
                })
              }
            />
            <ToggleRow
              title="Send optional SMS"
              description="Requires separate Twilio messaging setup"
              checked={settingsDraft.smsEnabled}
              onChange={(checked) =>
                onSettingsDraftChange("phone", {
                  ...settingsDraft,
                  smsEnabled: checked,
                })
              }
            />
          </div>
          <SaveCardFooter
            dirty={phoneDirty}
            state={saveState.phone}
            onSave={() => void onSaveCard("phone")}
          />
        </SettingsCard>

        <SettingsCard
          icon={AudioLines}
          title="ElevenLabs Voice Call"
          tag="Standard"
        >
          <Field label="API key">
            <input
              className="monoInput"
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
          </Field>
          <Field label="Agent ID">
            <input
              className="monoInput"
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
          </Field>
          <Field label="Agent phone number ID">
            <input
              className="monoInput"
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
          </Field>
          <p className="helperText">
            Connect or import a phone number inside ElevenLabs first. Swan does
            not need Twilio credentials for voice calls.
          </p>
          <SaveCardFooter
            dirty={elevenLabsDirty}
            state={saveState.elevenLabs}
            onSave={() => void onSaveCard("elevenLabs")}
          />
        </SettingsCard>

        <SettingsCard icon={MessageSquare} title="Twilio SMS" tag="Optional">
          <Field label="Account SID">
            <input
              className="monoInput"
              value={settingsDraft.twilio.accountSid}
              onChange={(event) =>
                onSettingsDraftChange("twilio", {
                  ...settingsDraft,
                  twilio: {
                    ...settingsDraft.twilio,
                    accountSid: event.currentTarget.value,
                  },
                })
              }
            />
          </Field>
          <Field label="API key SID">
            <input
              className="monoInput"
              value={settingsDraft.twilio.apiKeySid}
              onChange={(event) =>
                onSettingsDraftChange("twilio", {
                  ...settingsDraft,
                  twilio: {
                    ...settingsDraft.twilio,
                    apiKeySid: event.currentTarget.value,
                  },
                })
              }
            />
          </Field>
          <Field label="Client secret">
            <input
              className="monoInput"
              type="password"
              value={settingsDraft.twilio.clientSecret}
              onChange={(event) =>
                onSettingsDraftChange("twilio", {
                  ...settingsDraft,
                  twilio: {
                    ...settingsDraft.twilio,
                    clientSecret: event.currentTarget.value,
                  },
                })
              }
            />
          </Field>
          <Field label="From number">
            <input
              className="monoInput"
              value={settingsDraft.twilio.fromNumber}
              placeholder="+1 (888) 000-0000"
              onChange={(event) =>
                onSettingsDraftChange("twilio", {
                  ...settingsDraft,
                  twilio: {
                    ...settingsDraft.twilio,
                    fromNumber: event.currentTarget.value,
                  },
                })
              }
            />
          </Field>
          <p className="helperText">
            These credentials are only for optional direct SMS. Voice calls use
            ElevenLabs and work without this card.
          </p>
          <SaveCardFooter
            dirty={twilioDirty}
            state={saveState.twilio}
            onSave={() => void onSaveCard("twilio")}
          />
        </SettingsCard>

      </section>
    </>
  );
}

function DomainTrackingPage({
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
  stats,
}: {
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
  stats: { total: number; enabled: number; custom: number; seed: number };
}) {
  const domainFilters: Array<{ label: string; value: DomainFilter }> = [
    { label: "All", value: "all" },
    { label: "Enabled", value: "enabled" },
    { label: "Disabled", value: "disabled" },
    { label: "Custom", value: "user" },
    { label: "Seed", value: "seed" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Domain Tracking"
        title="Tracked domains"
        description="Manage the configured list Swan watches. Subdomains are matched automatically."
      />

      <div className="summaryStrip" aria-label="Domain summary">
        <SummaryItem label="Total domains" value={stats.total} />
        <SummaryItem label="Enabled" value={stats.enabled} />
        <SummaryItem label="Custom" value={stats.custom} />
        <SummaryItem label="Seed" value={stats.seed} />
      </div>

      <section className="dataPanel" aria-labelledby="tracked-domains">
        <div className="panelHeader">
          <div className="titleWithIcon">
            <Globe2 size={18} aria-hidden="true" />
            <h2 id="tracked-domains">Domain Tracking</h2>
          </div>
        </div>

        <div className="panelBody">
          <div className="domainForm">
            <input
              className="monoInput"
              value={newDomain}
              placeholder="domain.com"
              onChange={(event) => onNewDomainChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void onAddRule();
              }}
            />
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
            Swan v0 detects configured domains only. It ships with a small seed
            list, matches subdomains, and lets you add or disable rules here.
          </p>
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
                        {rule.source === "user" ? (
                          <button
                            type="button"
                            className="dangerIconButton"
                            aria-label={`Remove ${rule.domain}`}
                            onClick={() => void onRemoveRule(rule.id)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        ) : null}
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
  stats,
}: {
  events: UrgeEvent[];
  logFilter: LogFilter;
  logSearch: string;
  onFilterChange: (filter: LogFilter) => void;
  onRefresh: () => Promise<void>;
  onSearchChange: (query: string) => void;
  rulesById: Map<string, DetectionRule>;
  stats: {
    total: number;
    smsSuccess: number;
    smsFailed: number;
    smsSkipped: number;
    callSuccess: number;
    callFailed: number;
    callSkipped: number;
  };
}) {
  const logFilters: Array<{ label: string; value: LogFilter }> = [
    { label: "All", value: "all" },
    { label: "Success", value: "success" },
    { label: "Failed", value: "failed" },
    { label: "Skipped", value: "skipped" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Logs"
        title="Detection history"
        description="Review browser detections and the SMS/call outcomes Swan recorded locally."
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

      <div className="summaryStrip logSummary" aria-label="Log summary">
        <SummaryItem label="Events" value={stats.total} />
        <ChannelSummary
          label="SMS"
          success={stats.smsSuccess}
          failed={stats.smsFailed}
          skipped={stats.smsSkipped}
        />
        <ChannelSummary
          label="Calls"
          success={stats.callSuccess}
          failed={stats.callFailed}
          skipped={stats.callSkipped}
        />
      </div>

      <section className="dataPanel" aria-labelledby="detection-logs">
        <div className="panelHeader">
          <div className="titleWithIcon">
            <List size={18} aria-hidden="true" />
            <h2 id="detection-logs">Logs</h2>
          </div>
        </div>

        <div className="panelBody">
          <div className="filterBar">
            <label className="searchBox">
              <Search size={15} aria-hidden="true" />
              <span className="srOnly">Search logs</span>
              <input
                value={logSearch}
                placeholder="Search by domain"
                onChange={(event) => onSearchChange(event.currentTarget.value)}
              />
            </label>
            <div className="filterChips" aria-label="Log filters">
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
                <th>SMS</th>
                <th>Call</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="emptyState" colSpan={5}>
                    Logs appear after a test alert or detected tracked domain.
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
                      <td data-label="SMS">
                        <StatusCell status={event.smsStatus} />
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

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="summaryItem">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChannelSummary({
  failed,
  label,
  skipped,
  success,
}: {
  failed: number;
  label: string;
  skipped: number;
  success: number;
}) {
  return (
    <div className="channelSummary">
      <span>{label}</span>
      <div className="channelSummaryValues">
        <StatusCount label="Success" state="success" value={success} />
        <StatusCount label="Failed" state="failed" value={failed} />
        <StatusCount label="Skipped" state="skipped" value={skipped} />
      </div>
    </div>
  );
}

function StatusCount({
  label,
  state,
  value,
}: {
  label: string;
  state: AlertStatus["state"];
  value: number;
}) {
  return (
    <span className={`statusCount ${state}`}>
      <strong>{value}</strong>
      {label}
    </span>
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
  if (state === "failed") return CircleAlert;
  if (state === "skipped") return Ban;
  return Clock;
}

function formatStatus(status: AlertStatus): string {
  if (status.state === "success") return "Success";
  if (status.state === "failed") return "Failed";
  if (status.state === "skipped") return "Skipped";
  return "Pending";
}

function formatStatusDetail(status: AlertStatus): string {
  if (status.state === "success") return status.providerId ?? "";
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

function countChannelStatus(
  events: UrgeEvent[],
  channel: "smsStatus" | "callStatus",
  state: AlertStatus["state"],
): number {
  return events.filter((event) => event[channel].state === state).length;
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
      saved.cooldownMinutes !== draft.cooldownMinutes ||
      saved.smsEnabled !== draft.smsEnabled ||
      saved.callEnabled !== draft.callEnabled
    );
  }

  if (cardId === "twilio") {
    return (
      saved.twilio.accountSid !== draft.twilio.accountSid ||
      saved.twilio.apiKeySid !== draft.twilio.apiKeySid ||
      saved.twilio.clientSecret !== draft.twilio.clientSecret ||
      saved.twilio.fromNumber !== draft.twilio.fromNumber
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
      cooldownMinutes: draft.cooldownMinutes,
      smsEnabled: draft.smsEnabled,
      callEnabled: draft.callEnabled,
    };
  }

  if (cardId === "twilio") {
    return { ...saved, twilio: draft.twilio };
  }

  return { ...saved, elevenLabs: draft.elevenLabs };
}

async function fetchBundledBootstrap(): Promise<SwanBootstrap | null> {
  const response = await fetch(chrome.runtime.getURL("/swan-bootstrap.json"), {
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
