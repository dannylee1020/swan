<template>
  <main class="swan-system">
    <header class="swan-system__header">
      <a class="swan-system__brand" href="/" aria-label="Swan home">
        <span class="swan-system__status-dot" aria-hidden="true"></span>
        <span>SWAN</span>
      </a>
      <nav class="swan-system__nav" aria-label="Landing navigation">
        <a href="/docs/">Docs</a>
        <a href="https://github.com/dannylee1020/swan">GitHub</a>
      </nav>
    </header>

    <section class="swan-system__hero" aria-labelledby="swan-system-title">
      <div class="swan-system__narrative">
        <p class="swan-system__section-label">Lust intercept</p>
        <h1 id="swan-system-title">A phone call when lust takes over.</h1>
        <p class="swan-system__lede">
          Swan is an open-source Chrome extension for people trying to stop
          porn use. When you open a site you chose to track, Swan redirects
          the tab and immediately calls you to break the addiction cycle.
        </p>
        <p class="swan-system__sublede">
          Self-hosted. Local browser storage. Provider accounts you control.
          Apache 2.0.
        </p>

        <div class="swan-system__actions" aria-label="Primary actions">
          <a class="swan-system__button swan-system__button--primary" href="/docs/guide/quick-start">
            Start local setup
          </a>
          <a class="swan-system__button" href="https://github.com/dannylee1020/swan">
            View GitHub
          </a>
        </div>
      </div>

      <aside class="swan-system__sequence" aria-label="Swan interruption sequence">
        <div class="swan-system__sequence-header">
          <span>FLOW: URGE_INTERRUPT</span>
          <span>STATUS: READY</span>
        </div>
        <ol class="swan-system__sequence-list">
          <li class="swan-system__sequence-step">
            <span class="swan-system__sequence-time">14:05:31</span>
            <p><strong>[SETUP]</strong> Extension configured and ready.</p>
          </li>
          <li class="swan-system__sequence-step">
            <span class="swan-system__sequence-time">14:05:34</span>
            <p><strong>[OPEN]</strong> Tracked site opened in this tab.</p>
          </li>
          <li class="swan-system__sequence-step">
            <span class="swan-system__sequence-time">14:05:35</span>
            <p><strong>[REDIRECT]</strong> Swan changes the tab before the loop takes hold.</p>
          </li>
          <li class="swan-system__sequence-step">
            <span class="swan-system__sequence-time">14:05:36</span>
            <p><strong>[CALL]</strong> Phone call starts for immediate interruption.</p>
          </li>
          <li class="swan-system__sequence-step swan-system__sequence-step--active">
            <span class="swan-system__sequence-time">14:05:44</span>
            <p><strong>[CLEAR]</strong> The addiction cycle stops before it starts.</p>
          </li>
        </ol>
      </aside>
    </section>

    <section id="architecture" class="swan-system__specs" aria-labelledby="requirements-title">
      <p id="requirements-title" class="swan-system__section-label">How Swan interrupts the loop</p>
      <div class="swan-system__spec-grid">
        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">01</span>
          <h2>Browser-local detection</h2>
          <p>
            Detection runs inside the Chromium extension. Swan does not send browsing history to an external server.
          </p>
          <span class="swan-system__spec-meta">Dependency: Chromium engine</span>
        </article>

        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">02</span>
          <h2>Phone-first interruption</h2>
          <p>
            Swan starts a voice call through your configured voice agent and phone infrastructure,
            shipped with Elevenlabs and Twilio by default.
          </p>
          <span class="swan-system__spec-meta">Integrations: ElevenLabs, Twilio</span>
        </article>

        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">03</span>
          <h2>No Cloud</h2>
          <p>
            Swan operates without a backend database, proxy, DNS filter,
            page classifier, or localhost daemon. Settings and logs stay in the
            browser profile.
          </p>
          <span class="swan-system__spec-meta">Storage: chrome.storage.local</span>
        </article>
      </div>
    </section>

    <footer class="swan-system__footer">
      <span>SWAN // APACHE 2.0</span>
      <span class="swan-system__footer-links">
        <a href="/docs/">DOCS</a>
        <span aria-hidden="true">//</span>
        <a href="https://github.com/dannylee1020/swan">GITHUB</a>
      </span>
    </footer>
  </main>
</template>
