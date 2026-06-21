<template>
  <main class="swan-system">
    <header class="swan-system__header">
      <a class="swan-system__brand" href="/" aria-label="Swan home">
        <span class="swan-system__status-dot" aria-hidden="true"></span>
        <span>SWAN</span>
      </a>
      <nav class="swan-system__nav" aria-label="Landing navigation">
        <a href="/docs/">Docs</a>
        <a href="https://blog.swan-oss.com/">Blog</a>
        <a href="https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg">Chrome</a>
        <a href="https://github.com/dannylee1020/swan">GitHub</a>
      </nav>
    </header>

    <section class="swan-system__hero" aria-labelledby="swan-system-title">
      <div class="swan-system__narrative">
        <p class="swan-system__section-label">Open source</p>
        <h1 id="swan-system-title">A phone call when lust takes over.</h1>
        <p class="swan-system__lede">
          Swan is an open-source Chrome extension for quitting porn. When you
          open a site you chose to track, Swan redirects the tab and calls you
          before the loop takes over.
        </p>
        <p class="swan-system__sublede">
          Open source. Bring-your-own-key. Browser-local rules and logs. Apache 2.0.
        </p>

        <div class="swan-system__actions" aria-label="Primary actions">
          <a class="swan-system__button swan-system__button--primary" href="https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg">
            Add to Chrome
          </a>
          <a class="swan-system__button" href="/docs/guide/quick-start">
            Local setup
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
            <p><strong>[INTERVENE]</strong> Call starts with a direct reminder.</p>
          </li>
          <li class="swan-system__sequence-step swan-system__sequence-step--active">
            <span class="swan-system__sequence-time">14:05:44</span>
            <p><strong>[ACT]</strong> One next action breaks the loop.</p>
          </li>
        </ol>
      </aside>
    </section>

    <section id="architecture" class="swan-system__specs" aria-labelledby="requirements-title">
      <p id="requirements-title" class="swan-system__section-label">How Swan interrupts the loop</p>
      <div class="swan-system__spec-grid">
        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">01</span>
          <h2>Open source browser extension</h2>
          <p>
            Swan runs in Chrome and watches only the domains you choose. Rules,
            logs, and provider settings stay in the browser profile, and the
            code is open to inspect.
          </p>
          <span class="swan-system__spec-meta">Code: Apache 2.0</span>
        </article>

        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">02</span>
          <h2>Free BYOK or managed</h2>
          <p>
            Use Swan Core with your own ElevenLabs account, or sign in to Swan
            for managed call delivery and billing. Detection stays in the
            extension either way.
          </p>
          <span class="swan-system__spec-meta">Modes: BYOK / Managed</span>
        </article>

        <article class="swan-system__spec-card">
          <span class="swan-system__spec-number">03</span>
          <h2>Interrupt, remind, follow through</h2>
          <p>
            When a tracked site opens, Swan redirects the tab, starts the
            intervention, reminds you what the urge is doing, and pushes toward
            one concrete next action.
          </p>
          <span class="swan-system__spec-meta">Loop: redirect / remind / act</span>
        </article>
      </div>
    </section>

    <footer class="swan-system__footer">
      <span>SWAN // APACHE 2.0</span>
      <span class="swan-system__footer-links">
        <a href="/docs/">DOCS</a>
        <span aria-hidden="true">//</span>
        <a href="https://blog.swan-oss.com/">BLOG</a>
        <span aria-hidden="true">//</span>
        <a href="https://github.com/dannylee1020/swan">GITHUB</a>
      </span>
    </footer>
  </main>
</template>
