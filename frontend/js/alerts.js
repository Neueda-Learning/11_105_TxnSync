/**
 * Alerts page — alerts grouped by the transaction that triggered them (a
 * single transaction can trip more than one active rule at once, e.g. a
 * large transfer to an unseen payee trips both the AMOUNT and NEW_PAYEE
 * rules), with search/filter/sort/pagination over the resulting groups,
 * a detail modal per alert, and the acknowledge/resolve/dismiss workflow
 * wired to PATCH /api/v1/alerts/{id}/status.
 *
 * This uses a hand-rolled card-list renderer rather than the shared
 * DataTable, since DataTable is row-per-record and has no concept of
 * grouping several alerts under one shared transaction header.
 *
 * Alert status follows a fixed workflow rather than a free-form field:
 *
 *   OPEN -> ACKNOWLEDGED -> INVESTIGATING -> CLOSED
 *                |                |
 *                v                v
 *            DISMISSED        DISMISSED
 *
 * The backend stores status as an unconstrained string (PATCH accepts
 * anything), so this state machine is enforced here on the frontend: the
 * detail modal only ever offers buttons for the current status's valid
 * next states, instead of a free select.
 */

const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const ALERT_PAGE_SIZE = 6;

const ALERT_TRANSITIONS = {
  OPEN: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'DISMISSED'],
  INVESTIGATING: ['CLOSED', 'DISMISSED'],
  CLOSED: [],
  DISMISSED: [],
};

const TRANSITION_META = {
  ACKNOWLEDGED: { label: 'Acknowledge', icon: 'fa-check', btnClass: 'btn-primary' },
  INVESTIGATING: { label: 'Start Investigating', icon: 'fa-magnifying-glass', btnClass: 'btn-primary' },
  CLOSED: { label: 'Close Alert', icon: 'fa-circle-check', btnClass: 'btn-success' },
  DISMISSED: { label: 'Dismiss', icon: 'fa-ban', btnClass: 'btn-secondary' },
};

let allAlerts = [];
let rulesById = new Map();
let txnsById = new Map();
let loadState = 'loading'; // loading | error | ready
let loadError = null;
let alertsPage = 1;

const ALERT_FILTERS = { status: '', severity: '', search: '', sortBy: 'recent' };

function severityOf(alert) {
  return (rulesById.get(alert.ruleId)?.severity || 'MEDIUM').toUpperCase();
}

function alertMatches(alert, term) {
  const rule = rulesById.get(alert.ruleId);
  const txn = txnsById.get(alert.transactionId);
  if (ALERT_FILTERS.status && (alert.status || '').toUpperCase() !== ALERT_FILTERS.status) return false;
  if (ALERT_FILTERS.severity && severityOf(alert) !== ALERT_FILTERS.severity) return false;
  if (term) {
    const haystack = [
      alert.id, alert.status, alert.resolutionNotes, rule?.ruleName, rule?.ruleType,
      txn?.payeeId, txn?.accountId, txn?.description, alert.transactionId, alert.ruleId,
    ].filter((v) => v !== null && v !== undefined).join(' ').toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

/** Groups by transactionId; a group is included if any of its alerts pass the active filters, and — for full context — shows every alert it has, not just the matching ones. */
function computeGroups() {
  const term = ALERT_FILTERS.search;
  const byTxn = new Map();
  allAlerts.forEach((alert) => {
    if (!byTxn.has(alert.transactionId)) byTxn.set(alert.transactionId, []);
    byTxn.get(alert.transactionId).push(alert);
  });

  let groups = [...byTxn.entries()]
    .map(([transactionId, alerts]) => ({
      transactionId,
      txn: txnsById.get(transactionId),
      alerts: alerts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }))
    .filter((g) => g.alerts.some((a) => alertMatches(a, term)));

  const latestOf = (g) => Math.max(...g.alerts.map((a) => new Date(a.createdAt).getTime() || 0));
  const maxSeverityOf = (g) => Math.max(...g.alerts.map((a) => SEVERITY_RANK[severityOf(a)] || 0));

  groups.sort((a, b) => {
    if (ALERT_FILTERS.sortBy === 'severity') return maxSeverityOf(b) - maxSeverityOf(a) || latestOf(b) - latestOf(a);
    if (ALERT_FILTERS.sortBy === 'count') return b.alerts.length - a.alerts.length || latestOf(b) - latestOf(a);
    return latestOf(b) - latestOf(a);
  });

  return groups;
}

function renderAlertRowHtml(alert) {
  const rule = rulesById.get(alert.ruleId);
  const severity = severityOf(alert);
  const tone = TxnSyncUI.toneFor('severity', severity);
  const color = TxnSyncUI.TONE_HEX[tone];
  return `
    <div class="txn-alert-row" data-alert-id="${alert.id}">
      <div class="alert-icon" style="background:${color}22; color:${color};"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div class="alert-body">
        <div class="alert-title">${TxnSyncUI.escapeHtml(rule?.ruleName || `Rule #${alert.ruleId}`)}</div>
        <div class="alert-sub">${TxnSyncUI.formatRelativeTime(alert.createdAt)}${alert.resolutionNotes ? ' · ' + TxnSyncUI.escapeHtml(alert.resolutionNotes) : ''}</div>
      </div>
      <div class="alert-side">
        ${TxnSyncUI.statusBadge('severity', severity)}
        ${TxnSyncUI.statusBadge('alertStatus', alert.status)}
        ${(alert.status || '').toUpperCase() === 'OPEN' ? `<button class="btn btn-success btn-sm btn-icon" data-quick-ack="${alert.id}" data-stop-row-click title="Acknowledge"><i class="fa-solid fa-check"></i></button>` : ''}
      </div>
    </div>
  `;
}

function renderGroupHtml(group) {
  const { txn, alerts, transactionId } = group;
  const txnLabel = txn
    ? `
      <div class="cell-mono cell-primary">#${txn.id} · ${TxnSyncUI.formatCurrency(txn.amount, txn.currency)}</div>
      <div class="cell-secondary">${TxnSyncUI.escapeHtml(txn.accountId)} → ${TxnSyncUI.escapeHtml(txn.payeeId)} · ${TxnSyncUI.formatRelativeTime(txn.timestamp)}</div>
    `
    : `<div class="cell-primary cell-mono">Transaction #${transactionId}</div>`;

  return `
    <div class="txn-group">
      <div class="txn-group-header">
        <div class="txn-summary">${txnLabel}</div>
        <span class="badge badge-primary badge-plain txn-group-count">${alerts.length} alert${alerts.length === 1 ? '' : 's'}</span>
      </div>
      <div class="txn-group-alerts">
        ${alerts.map(renderAlertRowHtml).join('')}
      </div>
    </div>
  `;
}

function renderSkeletonGroups() {
  const container = document.getElementById('alertGroupsContainer');
  container.innerHTML = Array.from({ length: 3 }).map(() => `
    <div class="txn-group">
      <div class="txn-group-header">
        <div class="skeleton skeleton-line" style="width:220px;height:16px;"></div>
        <div class="skeleton" style="width:70px;height:20px;border-radius:999px;"></div>
      </div>
      <div style="padding: var(--space-3) var(--space-5);">
        <div class="skeleton skeleton-line" style="width:60%;height:14px;"></div>
      </div>
    </div>
  `).join('');
  document.getElementById('alertsPaginationInfo').textContent = '';
  document.getElementById('alertsPaginationControls').innerHTML = '';
}

function renderAlertGroups() {
  const container = document.getElementById('alertGroupsContainer');
  const paginationInfo = document.getElementById('alertsPaginationInfo');
  const paginationControls = document.getElementById('alertsPaginationControls');

  if (loadState === 'loading') { renderSkeletonGroups(); return; }

  if (loadState === 'error') {
    TxnSyncUI.renderBlockState(container, {
      icon: 'fa-triangle-exclamation', danger: true,
      title: 'Could not load alerts',
      desc: loadError || 'Something went wrong.',
      actionHtml: '<button class="btn btn-secondary btn-sm" id="alertsRetryBtn"><i class="fa-solid fa-rotate-right"></i> Retry</button>',
    });
    document.getElementById('alertsRetryBtn')?.addEventListener('click', loadAlerts);
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    return;
  }

  const groups = computeGroups();
  if (groups.length === 0) {
    TxnSyncUI.renderBlockState(container, {
      icon: 'fa-shield-check', title: 'No alerts found',
      desc: 'Try adjusting your search or filters.',
    });
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(groups.length / ALERT_PAGE_SIZE));
  if (alertsPage > totalPages) alertsPage = totalPages;
  const start = (alertsPage - 1) * ALERT_PAGE_SIZE;
  const pageGroups = groups.slice(start, start + ALERT_PAGE_SIZE);

  container.innerHTML = pageGroups.map(renderGroupHtml).join('');
  const totalAlerts = groups.reduce((sum, g) => sum + g.alerts.length, 0);
  paginationInfo.textContent = `Showing ${start + 1}–${Math.min(start + ALERT_PAGE_SIZE, groups.length)} of ${groups.length} transaction${groups.length === 1 ? '' : 's'} (${totalAlerts} alert${totalAlerts === 1 ? '' : 's'})`;
  TxnSyncUI.renderPager(paginationControls, {
    page: alertsPage, totalPages,
    onChange: (p) => { alertsPage = p; renderAlertGroups(); },
  });
}

function wireGroupControls() {
  document.getElementById('alertGroupsContainer').addEventListener('click', (e) => {
    const ackBtn = e.target.closest('[data-quick-ack]');
    if (ackBtn) {
      quickAcknowledge(Number(ackBtn.dataset.quickAck));
      return;
    }
    const row = e.target.closest('[data-alert-id]');
    if (row) {
      const alert = allAlerts.find((a) => a.id === Number(row.dataset.alertId));
      if (alert) openAlertDetailModal(alert);
    }
  });
}

async function quickAcknowledge(id) {
  try {
    await TxnSyncApi.AlertsApi.updateStatus(id, 'ACKNOWLEDGED', null);
    const alert = allAlerts.find((a) => a.id === id);
    if (alert) alert.status = 'ACKNOWLEDGED';
    renderAlertGroups();
    TxnSyncUI.Toast.success(`Alert #${id} acknowledged`);
  } catch (err) {
    TxnSyncUI.Toast.error('Could not acknowledge alert', err.message);
  }
}

async function loadAlerts() {
  loadState = 'loading';
  renderAlertGroups();
  try {
    const [alerts, rules, transactions] = await Promise.all([
      TxnSyncApi.AlertsApi.list(),
      TxnSyncApi.RulesApi.list(false),
      TxnSyncApi.TransactionsApi.list(),
    ]);
    allAlerts = alerts;
    rulesById = new Map(rules.map((r) => [r.id, r]));
    txnsById = new Map(transactions.map((t) => [t.id, t]));
    loadState = 'ready';
    renderAlertGroups();
  } catch (err) {
    loadState = 'error';
    loadError = err.message;
    renderAlertGroups();
    TxnSyncUI.Toast.error('Failed to load alerts', err.message);
  }
}

/* ---------------- Detail modal ---------------- */

function alertDetailBodyHtml(a) {
  const rule = rulesById.get(a.ruleId);
  const txn = txnsById.get(a.transactionId);
  const nextStates = ALERT_TRANSITIONS[(a.status || '').toUpperCase()] || [];
  return `
    <div class="detail-grid">
      <div class="detail-item"><label>Alert ID</label><div class="value mono">#${a.id}</div></div>
      <div class="detail-item"><label>Status</label><div class="value">${TxnSyncUI.statusBadge('alertStatus', a.status)}</div></div>
      <div class="detail-item"><label>Rule</label><div class="value">${TxnSyncUI.escapeHtml(rule?.ruleName || `Rule #${a.ruleId}`)}</div></div>
      <div class="detail-item"><label>Severity</label><div class="value">${TxnSyncUI.statusBadge('severity', severityOf(a))}</div></div>
      <div class="detail-item"><label>Transaction</label><div class="value mono">${txn ? `#${txn.id}` : `#${a.transactionId}`}</div></div>
      <div class="detail-item"><label>Amount</label><div class="value">${txn ? TxnSyncUI.formatCurrency(txn.amount, txn.currency) : '—'}</div></div>
      <div class="detail-item"><label>Account → Payee</label><div class="value">${txn ? `${TxnSyncUI.escapeHtml(txn.accountId)} → ${TxnSyncUI.escapeHtml(txn.payeeId)}` : '—'}</div></div>
      <div class="detail-item"><label>Raised</label><div class="value">${TxnSyncUI.formatDateTime(a.createdAt)}</div></div>
      <div class="detail-item"><label>Acknowledged</label><div class="value">${a.acknowledgedAt ? TxnSyncUI.formatDateTime(a.acknowledgedAt) : '—'}</div></div>
      <div class="detail-item"><label>Time Since Raised</label><div class="value">${TxnSyncUI.formatRelativeTime(a.createdAt)}</div></div>
      ${a.resolutionNotes ? `<div class="detail-divider"></div><div class="detail-note" style="grid-column:1/-1;"><strong>Existing notes:</strong> ${TxnSyncUI.escapeHtml(a.resolutionNotes)}</div>` : ''}
    </div>
    <div class="detail-divider" style="margin: var(--space-5) 0;"></div>
    ${nextStates.length === 0
      ? `<p class="text-secondary" style="font-size:12.5px;">This alert is <strong>${TxnSyncUI.titleCase(a.status)}</strong> — a terminal state in the alert workflow, so no further status changes are possible.</p>`
      : `
        <form id="alertStatusForm" novalidate>
          <div class="form-grid single">
            <div class="form-field">
              <label class="form-label" for="f-resolutionNotes">Notes for this status change <span class="optional">(optional)</span></label>
              <textarea class="form-control" id="f-resolutionNotes" placeholder="Add context for the next status…"></textarea>
            </div>
          </div>
        </form>
      `}
  `;
}

function transitionButtonsHtml(currentStatus) {
  const nextStates = ALERT_TRANSITIONS[(currentStatus || '').toUpperCase()] || [];
  return nextStates.map((target) => {
    const meta = TRANSITION_META[target];
    return `<button class="btn ${meta.btnClass}" data-transition="${target}"><i class="fa-solid ${meta.icon}"></i> ${meta.label}</button>`;
  }).join('');
}

function openAlertDetailModal(row) {
  TxnSyncUI.openModal({
    title: `Alert #${row.id}`,
    subtitle: rulesById.get(row.ruleId)?.ruleName || `Rule #${row.ruleId}`,
    size: 'lg',
    bodyHtml: alertDetailBodyHtml(row),
    footerHtml: `
      <button class="btn btn-secondary" data-close>Done</button>
      ${transitionButtonsHtml(row.status)}
    `,
    onMount: (h) => {
      h.overlay.querySelector('[data-close]').addEventListener('click', h.close);
      h.overlay.querySelectorAll('[data-transition]').forEach((btn) => {
        btn.addEventListener('click', () => submitAlertTransition(h, row, btn.dataset.transition));
      });
    },
  });
}

async function submitAlertTransition(handle, original, targetStatus) {
  const overlay = handle.overlay;
  const notes = overlay.querySelector('#f-resolutionNotes')?.value.trim() || null;
  const buttons = overlay.querySelectorAll('[data-transition]');
  const activeBtn = overlay.querySelector(`[data-transition="${targetStatus}"]`);
  const originalHtml = activeBtn.innerHTML;

  buttons.forEach((b) => { b.disabled = true; });
  activeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

  try {
    await TxnSyncApi.AlertsApi.updateStatus(original.id, targetStatus, notes);
    handle.close();
    TxnSyncUI.Toast.success(`Alert #${original.id} updated`, `Status set to ${TxnSyncUI.titleCase(targetStatus)}.`);
    loadAlerts();
  } catch (err) {
    buttons.forEach((b) => { b.disabled = false; });
    activeBtn.innerHTML = originalHtml;
    TxnSyncUI.Toast.error('Could not update alert', err.message);
  }
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  wireGroupControls();
  loadAlerts();

  document.getElementById('alertSearch').addEventListener('input', TxnSyncUI.debounce((e) => {
    ALERT_FILTERS.search = e.target.value.trim().toLowerCase();
    alertsPage = 1;
    renderAlertGroups();
  }, 200));

  document.getElementById('alertStatusFilter').addEventListener('change', (e) => {
    ALERT_FILTERS.status = e.target.value;
    alertsPage = 1;
    renderAlertGroups();
  });
  document.getElementById('alertSeverityFilter').addEventListener('change', (e) => {
    ALERT_FILTERS.severity = e.target.value;
    alertsPage = 1;
    renderAlertGroups();
  });
  document.getElementById('alertSortBy').addEventListener('change', (e) => {
    ALERT_FILTERS.sortBy = e.target.value;
    alertsPage = 1;
    renderAlertGroups();
  });
});
