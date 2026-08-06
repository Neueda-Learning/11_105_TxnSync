/**
 * TxnSync app shell — injects the sidebar and header into every page from
 * one source of truth, wires mobile nav, the live clock, the backend
 * connectivity indicator, and the open-alerts nav badge.
 *
 * Each page sets `data-page`, `data-title`, `data-subtitle` and `data-root`
 * (path prefix back to the frontend root: "./" for top-level pages, "../"
 * for files under pages/) on <body>.
 */

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
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle navigation">
              <i class="fa-solid fa-bars"></i>
            </button>
            <div class="header-titles">
              <div class="header-title">${TxnSyncUI.escapeHtml(title)}</div>
              ${subtitle ? `<div class="header-subtitle">${TxnSyncUI.escapeHtml(subtitle)}</div>` : ''}
            </div>
          </div>
          <div class="header-right">
            <div class="header-clock" id="headerClock"></div>
            <a class="header-icon-btn" href="${root}pages/alerts.html" title="Open alerts" id="headerBell">
              <i class="fa-solid fa-bell"></i>
              <span class="ping" id="headerBellPing" style="display:none;"></span>
            </a>
            <div class="header-avatar" title="Operations">
              <i class="fa-solid fa-user-shield"></i>
            </div>
          </div>
        </header>
        <main class="page-content" id="pageContent"></main>
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
}

function wireMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  const open = () => { sidebar.classList.add('open'); overlay.classList.add('visible'); };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); };
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
