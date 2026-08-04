/**
 * Dashboard page — aggregates real data from the transactions, accounts,
 * rules, and alerts endpoints into operational stat cards and widgets.
 * There is no dedicated stats endpoint, so every number here is computed
 * client-side from the full collections the backend returns.
 */

const TONE_HEX = {
  primary: '#2f5bff', success: '#12875a', warning: '#b6720b',
  danger: '#d3352f', info: '#1179a8', neutral: '#5a6478',
};

function withinLastHours(isoDate, hours) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= hours * 60 * 60 * 1000;
}

function renderStatSkeletons() {
  const grid = document.getElementById('statGrid');
  grid.innerHTML = Array.from({ length: 4 }).map(() => `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="skeleton" style="width:40px;height:40px;border-radius:10px;"></div>
        <div class="skeleton" style="width:56px;height:20px;border-radius:999px;"></div>
      </div>
      <div class="skeleton skeleton-line" style="width:70%;height:26px;margin-bottom:8px;"></div>
      <div class="skeleton skeleton-line" style="width:50%;"></div>
    </div>
  `).join('');
}

function statCardHtml({ icon, tone, value, label, trend }) {
  return `
    <div class="stat-card c-${tone}">
      <div class="stat-card-top">
        <div class="stat-icon"><i class="fa-solid ${icon}"></i></div>
        ${trend ? `<span class="stat-trend ${trend.tone}">${trend.icon ? `<i class="fa-solid ${trend.icon}"></i>` : ''} ${TxnSyncUI.escapeHtml(trend.text)}</span>` : ''}
      </div>
      <div class="stat-value">${TxnSyncUI.escapeHtml(value)}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function renderStats({ transactions, accounts, rules, alerts }) {
  const grid = document.getElementById('statGrid');

  // Volume: group by currency, surface the currency with the most transactions.
  const byCurrency = {};
  transactions.forEach((t) => {
    const cur = t.currency || 'USD';
    byCurrency[cur] = byCurrency[cur] || { sum: 0, count: 0 };
    byCurrency[cur].sum += Number(t.amount) || 0;
    byCurrency[cur].count += 1;
  });
  const currencies = Object.keys(byCurrency);
  const primaryCurrency = currencies.sort((a, b) => byCurrency[b].count - byCurrency[a].count)[0] || 'USD';
  const primarySum = byCurrency[primaryCurrency]?.sum || 0;
  const otherCurrencies = currencies.length - 1;
  const last24h = transactions.filter((t) => withinLastHours(t.timestamp, 24)).length;

  const totalAccounts = accounts.length;
  const institutions = new Set(accounts.map((a) => a.institutionName).filter(Boolean));

  const activeRules = rules.filter((r) => r.isActive).length;
  const totalRules = rules.length;

  const openAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'OPEN').length;
  const ackAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'ACKNOWLEDGED').length;
  const resolvedAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'RESOLVED').length;

  grid.innerHTML = [
    statCardHtml({
      icon: 'fa-sack-dollar', tone: 'primary',
      value: TxnSyncUI.formatCurrency(primarySum, primaryCurrency),
      label: `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} processed${otherCurrencies > 0 ? ` · +${otherCurrencies} other currenc${otherCurrencies === 1 ? 'y' : 'ies'}` : ''}`,
      trend: last24h > 0
        ? { tone: 'up', icon: 'fa-arrow-trend-up', text: `+${last24h} today` }
        : { tone: 'flat', text: '0 today' },
    }),
    statCardHtml({
      icon: 'fa-building-columns', tone: 'success',
      value: TxnSyncUI.formatNumber(totalAccounts),
      label: 'Linked accounts in the network',
      trend: { tone: 'flat', text: `${institutions.size} institution${institutions.size === 1 ? '' : 's'}` },
    }),
    statCardHtml({
      icon: 'fa-shield-halved', tone: 'warning',
      value: TxnSyncUI.formatNumber(activeRules),
      label: `of ${totalRules} total monitoring rule${totalRules === 1 ? '' : 's'}`,
      trend: { tone: 'flat', text: `${totalRules - activeRules} inactive` },
    }),
    statCardHtml({
      icon: 'fa-triangle-exclamation', tone: 'danger',
      value: TxnSyncUI.formatNumber(openAlerts),
      label: `${ackAlerts} acknowledged · ${resolvedAlerts} resolved`,
      trend: openAlerts > 0
        ? { tone: 'down', icon: 'fa-arrow-up', text: 'Needs review' }
        : { tone: 'up', icon: 'fa-check', text: 'All clear' },
    }),
  ].join('');
}

function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recentTxnBody');
  const recent = transactions.slice(0, 8);
  if (recent.length === 0) {
    TxnSyncUI.renderTableMessageRow(tbody, 5, { title: 'No transactions yet', desc: 'Processed transactions will appear here.' });
    return;
  }
  tbody.innerHTML = recent.map((t) => {
    const isDebit = (t.type || '').toUpperCase() === 'DEBIT';
    const sign = isDebit ? '-' : '+';
    return `
      <tr>
        <td>
          <div class="cell-primary">${TxnSyncUI.escapeHtml(t.description || t.payeeId || 'Transaction')}</div>
          <div class="cell-secondary">${TxnSyncUI.escapeHtml(t.payeeInstitutionName || t.payeeId || '')}</div>
        </td>
        <td class="cell-mono">${TxnSyncUI.escapeHtml(t.accountId)}</td>
        <td style="color:${isDebit ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight:700;">${sign}${TxnSyncUI.formatCurrency(t.amount, t.currency)}</td>
        <td>${TxnSyncUI.statusBadge('txnStatus', t.status)}</td>
        <td class="cell-secondary">${TxnSyncUI.formatRelativeTime(t.timestamp)}</td>
      </tr>
    `;
  }).join('');
}

function renderStatusBreakdown(transactions) {
  const container = document.getElementById('statusBreakdown');
  if (transactions.length === 0) {
    TxnSyncUI.renderBlockState(container, { title: 'No data yet', desc: 'Status breakdown appears once transactions exist.' });
    return;
  }
  const counts = {};
  transactions.forEach((t) => {
    const s = (t.status || 'UNKNOWN').toUpperCase();
    counts[s] = (counts[s] || 0) + 1;
  });
  const total = transactions.length;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
    const tone = TxnSyncUI.toneFor('txnStatus', status);
    const pct = Math.round((count / total) * 100);
    return `
      <div class="breakdown-row">
        <div class="breakdown-row-top">
          <span class="label"><span class="dot" style="background:${TONE_HEX[tone]}"></span>${TxnSyncUI.titleCase(status)}</span>
          <span class="value">${count} · ${pct}%</span>
        </div>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${pct}%; background:${TONE_HEX[tone]}"></div></div>
      </div>
    `;
  }).join('');
  container.innerHTML = `<div class="breakdown-list">${rows}</div>`;
}

function renderTypeDonut(transactions) {
  const svg = document.getElementById('typeDonut');
  const legend = document.getElementById('typeLegend');
  if (transactions.length === 0) {
    svg.innerHTML = '';
    legend.innerHTML = `<div class="text-muted" style="font-size:12.5px;">No transactions yet</div>`;
    return;
  }
  const counts = {};
  transactions.forEach((t) => {
    const type = (t.type || 'OTHER').toUpperCase();
    counts[type] = (counts[type] || 0) + 1;
  });
  const palette = ['#2f5bff', '#12875a', '#b6720b', '#1179a8', '#d3352f'];
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = transactions.length;
  const radius = 46, circumference = 2 * Math.PI * radius;
  let offset = 0;

  const circles = entries.map(([type, count], i) => {
    const fraction = count / total;
    const length = fraction * circumference;
    const color = palette[i % palette.length];
    const circle = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="16"
      stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 60 60)" stroke-linecap="butt"></circle>`;
    offset += length;
    return { circle, type, count, color };
  });

  svg.innerHTML = `
    <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--color-neutral-light)" stroke-width="16"></circle>
    ${circles.map((c) => c.circle).join('')}
    <text x="60" y="56" text-anchor="middle" class="donut-center-label">${total}</text>
    <text x="60" y="72" text-anchor="middle" class="donut-center-sub">TOTAL</text>
  `;
  legend.innerHTML = circles.map((c) => `
    <div class="donut-legend-row">
      <span class="label"><span class="dot" style="background:${c.color}"></span>${TxnSyncUI.titleCase(c.type)}</span>
      <span class="value">${c.count}</span>
    </div>
  `).join('');
}

function renderRecentAlerts({ alerts, rules, transactions }) {
  const container = document.getElementById('recentAlertsFeed');
  const recent = alerts.slice(0, 5);
  if (recent.length === 0) {
    TxnSyncUI.renderBlockState(container, {
      icon: 'fa-shield-check', title: 'No alerts yet',
      desc: 'Alerts triggered by monitoring rules will show up here.',
    });
    return;
  }
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const txnById = new Map(transactions.map((t) => [t.id, t]));

  container.innerHTML = recent.map((alert) => {
    const rule = ruleById.get(alert.ruleId);
    const txn = txnById.get(alert.transactionId);
    const severity = rule?.severity || 'MEDIUM';
    const tone = TxnSyncUI.toneFor('severity', severity);
    return `
      <div class="feed-row">
        <div class="feed-icon" style="background:${TONE_HEX[tone]}22; color:${TONE_HEX[tone]};">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="feed-body">
          <div class="feed-title">${TxnSyncUI.escapeHtml(rule?.ruleName || `Rule #${alert.ruleId}`)}</div>
          <div class="feed-sub">${txn ? `${TxnSyncUI.escapeHtml(txn.accountId)} → ${TxnSyncUI.escapeHtml(txn.payeeId)} · ${TxnSyncUI.formatCurrency(txn.amount, txn.currency)}` : `Transaction #${alert.transactionId}`}</div>
        </div>
        <div class="feed-side">
          <div>${TxnSyncUI.statusBadge('alertStatus', alert.status)}</div>
          <div class="feed-time">${TxnSyncUI.formatRelativeTime(alert.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadDashboard() {
  renderStatSkeletons();
  try {
    const [transactions, accounts, rules, alerts] = await Promise.all([
      TxnSyncApi.TransactionsApi.list(),
      TxnSyncApi.AccountsApi.list(),
      TxnSyncApi.RulesApi.list(false),
      TxnSyncApi.AlertsApi.list(),
    ]);
    renderStats({ transactions, accounts, rules, alerts });
    renderRecentTransactions(transactions);
    renderStatusBreakdown(transactions);
    renderTypeDonut(transactions);
    renderRecentAlerts({ alerts, rules, transactions });
  } catch (err) {
    const grid = document.getElementById('statGrid');
    grid.style.gridColumn = '1 / -1';
    TxnSyncUI.renderBlockState(grid, {
      icon: 'fa-plug-circle-xmark', danger: true,
      title: 'Could not load dashboard data',
      desc: err.message || 'Something went wrong while contacting the TxnSync API.',
      actionHtml: '<button class="btn btn-secondary btn-sm" id="dashboardRetry"><i class="fa-solid fa-rotate-right"></i> Retry</button>',
    });
    document.getElementById('dashboardRetry')?.addEventListener('click', loadDashboard);
    TxnSyncUI.Toast.error('Failed to load dashboard', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Runs after layout.js's own listener (registered first) has mounted the shell.
  loadDashboard();
});
