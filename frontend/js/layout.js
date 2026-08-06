
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'fa-gauge-high' },
  { id: 'transactions', label: 'Transactions', href: 'pages/transactions.html', icon: 'fa-right-left' },
  { id: 'accounts', label: 'Accounts', href: 'pages/accounts.html', icon: 'fa-building-columns' },
  { id: 'rules', label: 'Rules', href: 'pages/rules.html', icon: 'fa-shield-halved' },
  { id: 'alerts', label: 'Alerts', href: 'pages/alerts.html', icon: 'fa-bell', badgeId: 'nav-alert-badge' },
];

function initLayout() {
  const body = document.body;
  const root = body.dataset.root || './';
  const currentPage = body.dataset.page || '';
  const title = body.dataset.title || 'TxnSync';
  const subtitle = body.dataset.subtitle || '';

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip-link" href="#pageContent">Skip to main content</a>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-mark">TS</div>
          <div class="sidebar-brand-text">TxnSync<small>Transaction Monitoring</small></div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Workspace</div>
          ${NAV_ITEMS.map((item) => `
            <a class="sidebar-link ${item.id === currentPage ? 'active' : ''}" href="${root}${item.href}">
              <i class="fa-solid ${item.icon}"></i>
              <span>${item.label}</span>
              ${item.badgeId ? `<span class="badge-count" id="${item.badgeId}" style="display:none;">0</span>` : ''}
            </a>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-status">
            <span class="sidebar-status-dot" id="connStatusDot"></span>
            <span id="connStatusText">Checking backend…</span>
          </div>
        </div>
      </aside>

      <div class="main-column">
        <header class="app-header">
          <div class="header-left">
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidebar">
              <i class="fa-solid fa-bars"></i>
            </button>
            <div class="header-titles">
              <h1 class="header-title">${TxnSyncUI.escapeHtml(title)}</h1>
              ${subtitle ? `<div class="header-subtitle">${TxnSyncUI.escapeHtml(subtitle)}</div>` : ''}
            </div>
          </div>
          <div class="header-right">
            <div class="header-clock" id="headerClock" aria-hidden="true"></div>
            <div class="header-popover-menu">
              <button class="header-icon-btn" id="a11yToggle" title="Accessibility options" aria-label="Accessibility options" aria-haspopup="true" aria-expanded="false" aria-controls="a11yPanel">
                <i class="fa-solid fa-universal-access"></i>
              </button>
              <div class="header-popover a11y-panel" id="a11yPanel" role="menu" aria-label="Accessibility options" hidden>
                <div class="a11y-panel-label" id="a11yFontLabel">Text size</div>
                <div class="a11y-seg" role="radiogroup" aria-labelledby="a11yFontLabel">
                  <button type="button" class="a11y-seg-btn" data-font-size="normal" role="radio" aria-checked="true">A</button>
                  <button type="button" class="a11y-seg-btn" data-font-size="lg" role="radio" aria-checked="false">A+</button>
                  <button type="button" class="a11y-seg-btn" data-font-size="xl" role="radio" aria-checked="false">A++</button>
                </div>
                <label class="switch a11y-panel-row" role="menuitemcheckbox">
                  <input type="checkbox" id="a11yContrastToggle" />
                  <span class="switch-track"></span>
                  <span>High contrast</span>
                </label>
                <label class="switch a11y-panel-row" role="menuitemcheckbox">
                  <input type="checkbox" id="a11yMotionToggle" />
                  <span class="switch-track"></span>
                  <span>Reduce motion</span>
                </label>
              </div>
            </div>
            <div class="header-popover-menu">
              <button class="header-icon-btn" id="themeToggle" title="Change theme" aria-label="Change theme" aria-haspopup="true" aria-expanded="false" aria-controls="themePanel">
                <i class="fa-solid fa-moon"></i>
              </button>
              <div class="header-popover theme-panel" id="themePanel" role="menu" aria-label="Theme" hidden>
                <button type="button" class="theme-option" data-theme-choice="light" role="menuitemradio" aria-checked="false">
                  <span class="theme-swatch light"></span> Light
                  <i class="fa-solid fa-check theme-check"></i>
                </button>
                <button type="button" class="theme-option" data-theme-choice="dark" role="menuitemradio" aria-checked="false">
                  <span class="theme-swatch dark"></span> Dark
                  <i class="fa-solid fa-check theme-check"></i>
                </button>
                <button type="button" class="theme-option" data-theme-choice="pink" role="menuitemradio" aria-checked="false">
                  <span class="theme-swatch pink"></span> Pink
                  <i class="fa-solid fa-check theme-check"></i>
                </button>
              </div>
            </div>
            <a class="header-icon-btn" href="${root}pages/alerts.html" title="Open alerts" id="headerBell" aria-label="Open alerts">
              <i class="fa-solid fa-bell"></i>
              <span class="ping" id="headerBellPing" style="display:none;"></span>
            </a>
            <div class="header-avatar" title="Operations" role="img" aria-label="Operations user">
              <i class="fa-solid fa-user-shield"></i>
            </div>
          </div>
        </header>
        <main class="page-content" id="pageContent" tabindex="-1"></main>
      </div>
    </div>
  `);

  // Move any pre-existing body content (the page's own markup) into #pageContent
  const pageContent = document.getElementById('pageContent');
  Array.from(body.children).forEach((child) => {
    if (child.id !== 'pageContent' && !child.classList.contains('sidebar-overlay') && !child.classList.contains('app-shell')) {
      pageContent.appendChild(child);
    }
  });

  wireMobileNav();
  wireClock();
  wireConnectivity();
  wireAlertBadge();
  wireThemeToggle();
  wireA11yPanel();
}

const THEME_KEY = 'txnsync-theme';
const THEME_META = {
  light: { icon: 'fa-sun', label: 'Light' },
  dark: { icon: 'fa-moon', label: 'Dark' },
  pink: { icon: 'fa-heart', label: 'Pink' },
};

function wireThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const icon = toggle.querySelector('i');
  const panel = document.getElementById('themePanel');
  const options = Array.from(panel.querySelectorAll('[data-theme-choice]'));

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (options.find((o) => o.getAttribute('aria-checked') === 'true') || options[0]).focus();
  };

  const applyTheme = (theme) => {
    const meta = THEME_META[theme] || THEME_META.light;
    root.setAttribute('data-theme', theme);
    icon.className = `fa-solid ${meta.icon}`;
    toggle.title = `Theme: ${meta.label}`;
    toggle.setAttribute('aria-label', `Change theme (current: ${meta.label})`);
    options.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.themeChoice === theme)));
  };
  applyTheme(root.getAttribute('data-theme') || 'light');

  toggle.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { closePanel(); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) closePanel();
  });

  options.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeChoice;
      applyTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
      closePanel();
      toggle.focus();
    });
  });
}

const FONT_SIZE_KEY = 'txnsync-font-size';
const CONTRAST_KEY = 'txnsync-contrast';
const MOTION_KEY = 'txnsync-motion';

function wireA11yPanel() {
  const root = document.documentElement;
  const toggle = document.getElementById('a11yToggle');
  const panel = document.getElementById('a11yPanel');
  const fontBtns = Array.from(panel.querySelectorAll('.a11y-seg-btn'));
  const contrastInput = document.getElementById('a11yContrastToggle');
  const motionInput = document.getElementById('a11yMotionToggle');

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (fontBtns.find((b) => b.getAttribute('aria-checked') === 'true') || fontBtns[0]).focus();
  };

  toggle.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { closePanel(); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) closePanel();
  });

  const applyFontSize = (size) => {
    if (size === 'normal') root.removeAttribute('data-font-size');
    else root.setAttribute('data-font-size', size);
    fontBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.fontSize === size)));
  };
  fontBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.fontSize;
      applyFontSize(size);
      localStorage.setItem(FONT_SIZE_KEY, size);
    });
  });
  applyFontSize(localStorage.getItem(FONT_SIZE_KEY) || 'normal');

  const applyContrast = (on) => {
    if (on) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    contrastInput.checked = on;
  };
  contrastInput.addEventListener('change', () => {
    applyContrast(contrastInput.checked);
    localStorage.setItem(CONTRAST_KEY, String(contrastInput.checked));
  });
  applyContrast(localStorage.getItem(CONTRAST_KEY) === 'true');

  const applyMotion = (on) => {
    if (on) root.setAttribute('data-reduced-motion', 'true');
    else root.removeAttribute('data-reduced-motion');
    motionInput.checked = on;
  };
  motionInput.addEventListener('change', () => {
    applyMotion(motionInput.checked);
    localStorage.setItem(MOTION_KEY, String(motionInput.checked));
  });
  applyMotion(localStorage.getItem(MOTION_KEY) === 'true');
}

function wireMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  const open = () => { sidebar.classList.add('open'); overlay.classList.add('visible'); toggle.setAttribute('aria-expanded', 'true'); };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  overlay.addEventListener('click', close);
  sidebar.querySelectorAll('.sidebar-link').forEach((link) => link.addEventListener('click', close));
}

function wireClock() {
  const el = document.getElementById('headerClock');
  const tick = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    el.innerHTML = `<strong>${time}</strong>${date}`;
  };
  tick();
  setInterval(tick, 1000);
}

async function wireConnectivity() {
  const dot = document.getElementById('connStatusDot');
  const text = document.getElementById('connStatusText');
  const check = async () => {
    const online = await TxnSyncApi.HealthApi.check();
    dot.className = `sidebar-status-dot ${online ? 'online' : 'offline'}`;
    text.textContent = online ? 'Backend connected' : 'Backend unreachable';
  };
  await check();
  setInterval(check, 30000);
}

async function wireAlertBadge() {
  try {
    const alerts = await TxnSyncApi.AlertsApi.list();
    const openCount = (alerts || []).filter((a) => (a.status || '').toUpperCase() === 'OPEN').length;
    const navBadge = document.getElementById('nav-alert-badge');
    const bellPing = document.getElementById('headerBellPing');
    if (openCount > 0) {
      if (navBadge) { navBadge.textContent = String(openCount); navBadge.style.display = ''; }
      if (bellPing) bellPing.style.display = '';
    }
  } catch (e) {
    // Best-effort UI hint only — page-level error states handle real failures.
  }
}

document.addEventListener('DOMContentLoaded', initLayout);
