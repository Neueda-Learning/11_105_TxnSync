/**
 * Alerts page — table (search/filter/sort/pagination) joined with rule and
 * transaction data, a detail modal, and the acknowledge/resolve/dismiss
 * workflow wired to PATCH /api/v1/alerts/{id}/status.
 */

let alertTable = null;
let allAlerts = [];
let allRulesForAlerts = [];
let allTxnsForAlerts = [];
let rulesById = new Map();
let txnsById = new Map();
const ALERT_FILTERS = { status: '', severity: '' };

function severityOf(alert) {
  return rulesById.get(alert.ruleId)?.severity || 'MEDIUM';
}

function buildAlertFilterFn() {
  return (row) => {
    if (ALERT_FILTERS.status && (row.status || '').toUpperCase() !== ALERT_FILTERS.status) return false;
    if (ALERT_FILTERS.severity && severityOf(row).toUpperCase() !== ALERT_FILTERS.severity) return false;
    return true;
  };
}

function alertSearchMatch(row, term) {
  const rule = rulesById.get(row.ruleId);
  const txn = txnsById.get(row.transactionId);
  const haystack = [
    row.id, row.status, row.resolutionNotes, rule?.ruleName, rule?.ruleType,
    txn?.payeeId, txn?.accountId, txn?.description, row.transactionId, row.ruleId,
  ].filter((v) => v !== null && v !== undefined).join(' ').toLowerCase();
  return haystack.includes(term);
}

function alertColumns() {
  return [
    {
      key: 'rule', label: 'Rule', sortable: true, sortValue: (r) => rulesById.get(r.ruleId)?.ruleName || '',
      render: (r) => {
        const rule = rulesById.get(r.ruleId);
        return `
          <div class="cell-primary">${TxnSyncUI.escapeHtml(rule?.ruleName || `Rule #${r.ruleId}`)}</div>
          <div class="cell-secondary">${TxnSyncUI.escapeHtml(rule?.ruleType || '')}</div>
        `;
      },
    },
    {
      key: 'severity', label: 'Severity', sortable: true, sortValue: (r) => severityOf(r),
      render: (r) => TxnSyncUI.statusBadge('severity', severityOf(r)),
    },
    {
      key: 'transaction', label: 'Transaction',
      render: (r) => {
        const txn = txnsById.get(r.transactionId);
        if (!txn) return `<span class="cell-mono">#${r.transactionId}</span>`;
        return `
          <div class="cell-mono cell-primary">#${txn.id} · ${TxnSyncUI.formatCurrency(txn.amount, txn.currency)}</div>
          <div class="cell-secondary">${TxnSyncUI.escapeHtml(txn.accountId)} → ${TxnSyncUI.escapeHtml(txn.payeeId)}</div>
        `;
      },
    },
    { key: 'status', label: 'Status', sortable: true, sortValue: (r) => r.status || '', render: (r) => TxnSyncUI.statusBadge('alertStatus', r.status) },
    {
      key: 'createdAt', label: 'Raised', sortable: true, sortValue: (r) => new Date(r.createdAt).getTime() || 0,
      render: (r) => `
        <div>${TxnSyncUI.formatDate(r.createdAt)}</div>
        <div class="cell-secondary">${TxnSyncUI.formatRelativeTime(r.createdAt)}</div>
      `,
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => (r.status || '').toUpperCase() === 'OPEN'
        ? `<div class="cell-actions" data-stop-row-click><button class="btn btn-success btn-sm" data-quick-ack="${r.id}"><i class="fa-solid fa-check"></i> Acknowledge</button></div>`
        : '',
    },
  ];
}

function initTable() {
  alertTable = new DataTable(document.getElementById('alertTableContainer'), {
    columns: alertColumns(),
    pageSize: 10,
    defaultSortKey: 'createdAt',
    defaultSortDir: 'desc',
    rowKey: (r) => r.id,
    onRowClick: (row) => openAlertDetailModal(row),
    searchMatch: alertSearchMatch,
    emptyState: {
      icon: 'fa-shield-check', title: 'No alerts found',
      desc: 'Try adjusting your search or filters.',
    },
  });
  alertTable.setLoading();
}

function wireRowControls() {
  document.getElementById('alertTableContainer').addEventListener('click', (e) => {
    const ackBtn = e.target.closest('[data-quick-ack]');
    if (ackBtn) quickAcknowledge(Number(ackBtn.dataset.quickAck));
  });
}

async function quickAcknowledge(id) {
  try {
    await TxnSyncApi.AlertsApi.updateStatus(id, 'ACKNOWLEDGED', null);
    const alert = allAlerts.find((a) => a.id === id);
    if (alert) alert.status = 'ACKNOWLEDGED';
    alertTable.setData(allAlerts);
    TxnSyncUI.Toast.success(`Alert #${id} acknowledged`);
  } catch (err) {
    TxnSyncUI.Toast.error('Could not acknowledge alert', err.message);
  }
}

async function loadAlerts() {
  alertTable?.setLoading();
  try {
    const [alerts, rules, transactions] = await Promise.all([
      TxnSyncApi.AlertsApi.list(),
      TxnSyncApi.RulesApi.list(false),
      TxnSyncApi.TransactionsApi.list(),
    ]);
    allAlerts = alerts;
    allRulesForAlerts = rules;
    allTxnsForAlerts = transactions;
    rulesById = new Map(rules.map((r) => [r.id, r]));
    txnsById = new Map(transactions.map((t) => [t.id, t]));
    alertTable.setData(alerts);
  } catch (err) {
    alertTable.setError(err.message, loadAlerts);
    TxnSyncUI.Toast.error('Failed to load alerts', err.message);
  }
}

/* ---------------- Detail modal ---------------- */

function alertDetailBodyHtml(a) {
  const rule = rulesById.get(a.ruleId);
  const txn = txnsById.get(a.transactionId);
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
    <form id="alertStatusForm" novalidate>
      <div class="form-grid">
        <div class="form-field">
          <label class="form-label" for="f-alertStatus">Update Status</label>
          <select class="form-control" id="f-alertStatus">
            ${['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].map((s) => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${TxnSyncUI.titleCase(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field span-2">
          <label class="form-label" for="f-resolutionNotes">Resolution Notes <span class="optional">(optional)</span></label>
          <textarea class="form-control" id="f-resolutionNotes" placeholder="Add context for this status change…">${TxnSyncUI.escapeHtml(a.resolutionNotes || '')}</textarea>
        </div>
      </div>
    </form>
  `;
}

function openAlertDetailModal(row) {
  const handle = TxnSyncUI.openModal({
    title: `Alert #${row.id}`,
    subtitle: rulesById.get(row.ruleId)?.ruleName || `Rule #${row.ruleId}`,
    size: 'lg',
    bodyHtml: alertDetailBodyHtml(row),
    footerHtml: `
      <button class="btn btn-secondary" data-close>Close</button>
      <button class="btn btn-primary" id="submitAlertStatusBtn"><i class="fa-solid fa-floppy-disk"></i> Update Status</button>
    `,
    onMount: (h) => {
      h.overlay.querySelector('[data-close]').addEventListener('click', h.close);
      h.overlay.querySelector('#submitAlertStatusBtn').addEventListener('click', () => submitAlertStatus(h, row));
    },
  });
}

async function submitAlertStatus(handle, original) {
  const overlay = handle.overlay;
  const status = overlay.querySelector('#f-alertStatus').value;
  const notes = overlay.querySelector('#f-resolutionNotes').value.trim() || null;

  const btn = overlay.querySelector('#submitAlertStatusBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

  try {
    await TxnSyncApi.AlertsApi.updateStatus(original.id, status, notes);
    handle.close();
    TxnSyncUI.Toast.success(`Alert #${original.id} updated`, `Status set to ${TxnSyncUI.titleCase(status)}.`);
    loadAlerts();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Status';
    TxnSyncUI.Toast.error('Could not update alert', err.message);
  }
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  wireRowControls();
  loadAlerts();

  document.getElementById('alertSearch').addEventListener('input', TxnSyncUI.debounce((e) => {
    alertTable.setSearchTerm(e.target.value);
  }, 200));

  document.getElementById('alertStatusFilter').addEventListener('change', (e) => {
    ALERT_FILTERS.status = e.target.value;
    alertTable.setFilter(buildAlertFilterFn());
  });
  document.getElementById('alertSeverityFilter').addEventListener('change', (e) => {
    ALERT_FILTERS.severity = e.target.value;
    alertTable.setFilter(buildAlertFilterFn());
  });
});
