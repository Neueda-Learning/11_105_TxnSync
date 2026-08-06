


const TONE_HEX = TxnSyncUI.TONE_HEX;

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

  const activeRules = rules.filter((r) => r.active).length;
  const totalRules = rules.length;

  const openAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'OPEN').length;
  const ackAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'ACKNOWLEDGED').length;
  const investigatingAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'INVESTIGATING').length;
  const closedAlerts = alerts.filter((a) => (a.status || '').toUpperCase() === 'CLOSED').length;

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
      label: `${ackAlerts} acknowledged · ${investigatingAlerts} investigating · ${closedAlerts} closed`,
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

/* ---------------- Shared chart tooltip ---------------- */

function getChartTooltip() {
  let tip = document.getElementById('chartTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'chartTooltip';
    tip.className = 'chart-tooltip';
    document.body.appendChild(tip);
  }
  return tip;
}

function showChartTooltip(target, html) {
  const tip = getChartTooltip();
  tip.innerHTML = html;
  tip.classList.add('visible');
  const rect = target.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
  tip.style.left = `${left}px`;
  tip.style.top = `${rect.top - tipRect.height - 8}px`;
}

function hideChartTooltip() {
  getChartTooltip().classList.remove('visible');
}

/* ---------------- Alert Lifecycle (donut + KPI) ---------------- */

const ALERT_STATUS_ORDER = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED', 'DISMISSED'];

function renderAlertLifecycle(alerts) {
  const svg = document.getElementById('alertLifecycleDonut');
  const legend = document.getElementById('alertLifecycleLegend');
  const kpi = document.getElementById('alertLifecycleKpi');

  if (alerts.length === 0) {
    svg.innerHTML = '';
    legend.innerHTML = `<div class="text-muted" style="font-size:12.5px;">No alerts yet</div>`;
    kpi.innerHTML = '';
    return;
  }

  const counts = {};
  alerts.forEach((a) => {
    const status = (a.status || 'UNKNOWN').toUpperCase();
    counts[status] = (counts[status] || 0) + 1;
  });
  const total = alerts.length;
  const activeCount = (counts.OPEN || 0) + (counts.ACKNOWLEDGED || 0) + (counts.INVESTIGATING || 0);

  const radius = 46, circumference = 2 * Math.PI * radius;
  let offset = 0;
  // Each status keeps its own fixed tone (matches the status badges everywhere else in the
  // app) rather than being assigned a color by rank, so a color always means the same status.
  const segments = ALERT_STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => {
    const count = counts[status];
    const color = TONE_HEX[TxnSyncUI.toneFor('alertStatus', status)];
    const fraction = count / total;
    const length = fraction * circumference;
    const circle = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="16"
      stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 60 60)" stroke-linecap="butt"><title>${TxnSyncUI.titleCase(status)}: ${count} (${Math.round(fraction * 100)}%)</title></circle>`;
    offset += length;
    return { circle, status, count, color };
  });

  svg.innerHTML = `
    <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--color-neutral-light)" stroke-width="16"></circle>
    ${segments.map((s) => s.circle).join('')}
    <text x="60" y="56" text-anchor="middle" class="donut-center-label">${total}</text>
    <text x="60" y="72" text-anchor="middle" class="donut-center-sub">TOTAL</text>
  `;
  legend.innerHTML = segments.map((s) => `
    <div class="donut-legend-row">
      <span class="label"><span class="dot" style="background:${s.color}"></span>${TxnSyncUI.titleCase(s.status)}</span>
      <span class="value">${s.count} · ${Math.round((s.count / total) * 100)}%</span>
    </div>
  `).join('');

  kpi.innerHTML = `
    <div class="kpi-pill ${activeCount > 0 ? 'danger' : 'success'}">
      <i class="fa-solid ${activeCount > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
      <span><strong>${activeCount}</strong> active — needs review</span>
    </div>
  `;
}

/* ---------------- Alerts by Rule Type (bar chart) ---------------- */

const RULE_TYPE_LABELS = { AMOUNT: 'Amount Threshold', VELOCITY: 'Velocity', NEW_PAYEE: 'New Payee', DAILY_LIMIT: 'Daily Limit' };
// Fixed per-type color (not assigned by rank) so a rule type always reads the same hue.
const RULE_TYPE_TONE = { AMOUNT: 'primary', VELOCITY: 'info', NEW_PAYEE: 'warning', DAILY_LIMIT: 'success' };

function renderAlertsByRuleType({ alerts, rules }) {
  const container = document.getElementById('ruleTypeBarChart');
  if (alerts.length === 0) {
    TxnSyncUI.renderBlockState(container, { title: 'No data yet', desc: 'Rule breakdown appears once alerts exist.' });
    return;
  }
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const counts = {};
  alerts.forEach((a) => {
    const type = ruleById.get(a.ruleId)?.ruleType || 'OTHER';
    counts[type] = (counts[type] || 0) + 1;
  });
  const total = alerts.length;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  container.innerHTML = entries.map(([type, count]) => {
    const label = RULE_TYPE_LABELS[type] || TxnSyncUI.titleCase(type);
    const color = TONE_HEX[RULE_TYPE_TONE[type] || 'neutral'];
    const pct = Math.round((count / total) * 100);
    return `
      <div class="breakdown-row" data-bar-tooltip="${TxnSyncUI.escapeHtml(label)}: ${count} alert${count === 1 ? '' : 's'} (${pct}%)">
        <div class="breakdown-row-top">
          <span class="label"><span class="dot" style="background:${color}"></span>${TxnSyncUI.escapeHtml(label)}</span>
          <span class="value">${count} · ${pct}%</span>
        </div>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${pct}%; background:${color}"></div></div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-bar-tooltip]').forEach((row) => {
    row.addEventListener('mouseenter', () => showChartTooltip(row, TxnSyncUI.escapeHtml(row.dataset.barTooltip)));
    row.addEventListener('mouseleave', hideChartTooltip);
  });
}

/* ---------------- Transaction Volume vs. Alert Activity (time series) ---------------- */

const TS_BUCKET_CANDIDATES_MS = [
  60e3, 5 * 60e3, 15 * 60e3, 30 * 60e3,
  3600e3, 2 * 3600e3, 3 * 3600e3, 6 * 3600e3, 12 * 3600e3,
  86400e3, 2 * 86400e3, 7 * 86400e3,
];
const TS_MAX_BUCKETS = 14;

function pickBucketMs(rangeMs) {
  for (const c of TS_BUCKET_CANDIDATES_MS) {
    if (rangeMs / c <= TS_MAX_BUCKETS) return c;
  }
  return TS_BUCKET_CANDIDATES_MS[TS_BUCKET_CANDIDATES_MS.length - 1];
}

function formatBucketLabel(date, bucketMs) {
  if (bucketMs < 3600e3) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (bucketMs < 86400e3) return date.toLocaleTimeString('en-US', { hour: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderVolumeVsAlerts({ transactions, alerts }) {
  const container = document.getElementById('volumeAlertsChart');
  const times = [
    ...transactions.map((t) => new Date(t.timestamp).getTime()),
    ...alerts.map((a) => new Date(a.createdAt).getTime()),
  ].filter((t) => !Number.isNaN(t));

  if (times.length === 0) {
    TxnSyncUI.renderBlockState(container, { title: 'No data yet', desc: 'Activity over time appears once transactions or alerts exist.' });
    return;
  }

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const bucketMs = pickBucketMs(Math.max(maxTime - minTime, 1));
  const bucketStart = Math.floor(minTime / bucketMs) * bucketMs;
  const bucketCount = Math.max(1, Math.ceil((maxTime - bucketStart + 1) / bucketMs));

  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    start: bucketStart + i * bucketMs,
    txnCount: 0,
    alertCount: 0,
  }));
  const bucketIndex = (ts) => Math.min(bucketCount - 1, Math.max(0, Math.floor((ts - bucketStart) / bucketMs)));
  transactions.forEach((t) => {
    const ts = new Date(t.timestamp).getTime();
    if (!Number.isNaN(ts)) buckets[bucketIndex(ts)].txnCount += 1;
  });
  alerts.forEach((a) => {
    const ts = new Date(a.createdAt).getTime();
    if (!Number.isNaN(ts)) buckets[bucketIndex(ts)].alertCount += 1;
  });

  const maxTxn = Math.max(1, ...buckets.map((b) => b.txnCount));
  const maxAlert = Math.max(1, ...buckets.map((b) => b.alertCount));
  // Show at most ~6 axis labels so ticks never crowd, per bucket count.
  const labelStride = Math.max(1, Math.ceil(bucketCount / 6));

  const txnBars = buckets.map((b, i) => {
    const label = formatBucketLabel(new Date(b.start), bucketMs);
    return `<div class="ts-bar" style="height:${(b.txnCount / maxTxn) * 100}%" data-ts-tooltip="${TxnSyncUI.escapeHtml(label)}: ${b.txnCount} transaction${b.txnCount === 1 ? '' : 's'}"></div>`;
  }).join('');
  const alertBars = buckets.map((b) => {
    const label = formatBucketLabel(new Date(b.start), bucketMs);
    return `<div class="ts-bar alert" style="height:${(b.alertCount / maxAlert) * 100}%" data-ts-tooltip="${TxnSyncUI.escapeHtml(label)}: ${b.alertCount} alert${b.alertCount === 1 ? '' : 's'}"></div>`;
  }).join('');
  const axisLabels = buckets.map((b, i) =>
    `<span>${i % labelStride === 0 ? TxnSyncUI.escapeHtml(formatBucketLabel(new Date(b.start), bucketMs)) : ''}</span>`
  ).join('');

  container.innerHTML = `
    <div class="ts-pane">
      <div class="ts-pane-label"><span class="dot" style="background:var(--color-primary)"></span>Transactions</div>
      <div class="ts-bars">${txnBars}</div>
    </div>
    <div class="ts-pane">
      <div class="ts-pane-label"><span class="dot" style="background:var(--color-danger)"></span>Alerts</div>
      <div class="ts-bars">${alertBars}</div>
    </div>
    <div class="ts-axis">${axisLabels}</div>
  `;

  container.querySelectorAll('[data-ts-tooltip]').forEach((bar) => {
    bar.addEventListener('mouseenter', () => showChartTooltip(bar, TxnSyncUI.escapeHtml(bar.dataset.tsTooltip)));
    bar.addEventListener('mouseleave', hideChartTooltip);
  });
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
    renderAlertLifecycle(alerts);
    renderAlertsByRuleType({ alerts, rules });
    renderVolumeVsAlerts({ transactions, alerts });
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
