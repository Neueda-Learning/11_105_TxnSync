/**
 * Transactions page — table (search/filter/sort/pagination), transaction
 * detail modal, and the "New Transaction" form that exercises the real
 * process-transaction + rule-evaluation workflow on the backend.
 */

let txnTable = null;
let allAccounts = [];
let allTransactions = [];
let accountsById = new Map();

const TXN_FILTERS = { status: '', type: '', currency: '' };

function buildTxnFilterFn() {
  return (row) => {
    if (TXN_FILTERS.status && (row.status || '').toUpperCase() !== TXN_FILTERS.status) return false;
    if (TXN_FILTERS.type && (row.type || '').toUpperCase() !== TXN_FILTERS.type) return false;
    if (TXN_FILTERS.currency && (row.currency || '').toUpperCase() !== TXN_FILTERS.currency) return false;
    return true;
  };
}

function txnColumns() {
  return [
    {
      key: 'id', label: 'ID', sortable: true, sortValue: (r) => r.id,
      render: (r) => `<span class="cell-mono">#${r.id}</span>`,
    },
    {
      key: 'payee', label: 'Transaction',
      render: (r) => `
        <div class="cell-primary">${TxnSyncUI.escapeHtml(r.description || r.payeeId)}</div>
        <div class="cell-secondary">to ${TxnSyncUI.escapeHtml(r.payeeId)}${r.payeeInstitutionName ? ' · ' + TxnSyncUI.escapeHtml(r.payeeInstitutionName) : ''}</div>
      `,
    },
    {
      key: 'accountId', label: 'Account', sortable: true, sortValue: (r) => r.accountId,
      render: (r) => {
        const acc = accountsById.get(r.accountId);
        return `
          <div class="cell-mono">${TxnSyncUI.escapeHtml(r.accountId)}</div>
          ${acc ? `<div class="cell-secondary">${TxnSyncUI.escapeHtml(acc.accountName)}</div>` : ''}
        `;
      },
    },
    {
      key: 'amount', label: 'Amount', sortable: true, align: 'right', sortValue: (r) => Number(r.amount) || 0,
      render: (r) => {
        const isDebit = (r.type || '').toUpperCase() === 'DEBIT';
        return `<span style="font-weight:700; color:${isDebit ? 'var(--color-danger)' : 'var(--color-success)'}">${isDebit ? '-' : '+'}${TxnSyncUI.formatCurrency(r.amount, r.currency)}</span>`;
      },
    },
    {
      key: 'type', label: 'Type', sortable: true, sortValue: (r) => r.type || '',
      render: (r) => {
        const isDebit = (r.type || '').toUpperCase() === 'DEBIT';
        return `<span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;color:${isDebit ? 'var(--color-danger)' : 'var(--color-success)'}">
          <i class="fa-solid ${isDebit ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${TxnSyncUI.titleCase(r.type)}
        </span>`;
      },
    },
    { key: 'status', label: 'Status', sortable: true, sortValue: (r) => r.status || '', render: (r) => TxnSyncUI.statusBadge('txnStatus', r.status) },
    {
      key: 'timestamp', label: 'Time', sortable: true, sortValue: (r) => new Date(r.timestamp).getTime() || 0,
      render: (r) => `
        <div>${TxnSyncUI.formatDate(r.timestamp)}</div>
        <div class="cell-secondary">${TxnSyncUI.formatRelativeTime(r.timestamp)}</div>
      `,
    },
  ];
}

function initTable() {
  txnTable = new DataTable(document.getElementById('txnTableContainer'), {
    columns: txnColumns(),
    pageSize: 10,
    defaultSortKey: 'timestamp',
    defaultSortDir: 'desc',
    rowKey: (r) => r.id,
    onRowClick: (row) => openTxnDetailModal(row),
    emptyState: {
      icon: 'fa-right-left', title: 'No transactions found',
      desc: 'Try adjusting your search or filters, or create a new transaction.',
    },
  });
  txnTable.setLoading();
}

function populateCurrencyFilter(transactions) {
  const select = document.getElementById('txnCurrencyFilter');
  const currencies = [...new Set(transactions.map((t) => t.currency).filter(Boolean))].sort();
  currencies.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

async function loadTransactions() {
  txnTable?.setLoading();
  try {
    const [transactions, accounts] = await Promise.all([
      TxnSyncApi.TransactionsApi.list(),
      TxnSyncApi.AccountsApi.list(),
    ]);
    allTransactions = transactions;
    allAccounts = accounts;
    accountsById = new Map(accounts.map((a) => [a.accountId, a]));
    populateCurrencyFilter(transactions);
    txnTable.setData(transactions);
  } catch (err) {
    txnTable.setError(err.message, loadTransactions);
    TxnSyncUI.Toast.error('Failed to load transactions', err.message);
  }
}

/* ---------------- Detail modal ---------------- */

function txnDetailBodyHtml(t) {
  const acc = accountsById.get(t.accountId);
  return `
    <div class="detail-grid">
      <div class="detail-item"><label>Transaction ID</label><div class="value mono">#${t.id}</div></div>
      <div class="detail-item"><label>Status</label><div class="value">${TxnSyncUI.statusBadge('txnStatus', t.status)}</div></div>
      <div class="detail-item"><label>Account</label><div class="value mono">${TxnSyncUI.escapeHtml(t.accountId)}</div></div>
      <div class="detail-item"><label>Account Holder</label><div class="value">${TxnSyncUI.escapeHtml(acc?.accountName || '—')}</div></div>
      <div class="detail-item"><label>Payee</label><div class="value mono">${TxnSyncUI.escapeHtml(t.payeeId)}</div></div>
      <div class="detail-item"><label>Payee Institution</label><div class="value">${TxnSyncUI.escapeHtml(t.payeeInstitutionName || '—')}</div></div>
      <div class="detail-item"><label>Amount</label><div class="value">${TxnSyncUI.formatCurrency(t.amount, t.currency)}</div></div>
      <div class="detail-item"><label>Type</label><div class="value">${TxnSyncUI.titleCase(t.type)}</div></div>
      <div class="detail-item"><label>Processed</label><div class="value">${TxnSyncUI.formatDateTime(t.timestamp)}</div></div>
      <div class="detail-item"><label>Relative</label><div class="value">${TxnSyncUI.formatRelativeTime(t.timestamp)}</div></div>
      ${t.description ? `<div class="detail-divider"></div><div class="detail-item" style="grid-column:1/-1;"><label>Description</label><div class="value" style="font-weight:400;">${TxnSyncUI.escapeHtml(t.description)}</div></div>` : ''}
    </div>
  `;
}

function openTxnDetailModal(row) {
  const handle = TxnSyncUI.openModal({
    title: `Transaction #${row.id}`,
    subtitle: TxnSyncUI.formatDateTime(row.timestamp),
    bodyHtml: `<div id="txnDetailBody"><div class="skeleton skeleton-line" style="height:120px;"></div></div>`,
    footerHtml: `<button class="btn btn-secondary" data-close>Close</button>`,
    onMount: (h) => h.overlay.querySelector('[data-close]').addEventListener('click', h.close),
  });

  TxnSyncApi.TransactionsApi.getById(row.id).then((fresh) => {
    const body = handle.overlay.querySelector('#txnDetailBody');
    body.innerHTML = txnDetailBodyHtml(fresh || row);
  }).catch(() => {
    const body = handle.overlay.querySelector('#txnDetailBody');
    body.innerHTML = txnDetailBodyHtml(row);
  });
}

/* ---------------- New Transaction modal ---------------- */

function accountOptionsHtml() {
  if (allAccounts.length === 0) {
    return '<option value="">No accounts available — create one first</option>';
  }
  return '<option value="">Select an account…</option>' + allAccounts.map((a) =>
    `<option value="${TxnSyncUI.escapeHtml(a.accountId)}">${TxnSyncUI.escapeHtml(a.accountId)} — ${TxnSyncUI.escapeHtml(a.accountName)}</option>`
  ).join('');
}

function newTxnFormHtml() {
  return `
    <form id="newTxnForm" novalidate>
      <div class="form-grid">
        <div class="form-field span-2">
          <label class="form-label" for="f-accountId">Source Account</label>
          <select class="form-control" id="f-accountId" required>${accountOptionsHtml()}</select>
          <div class="form-error">Please select the source account.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-payeeId">Payee ID</label>
          <input class="form-control" id="f-payeeId" placeholder="e.g. PAYEE-A" required />
          <div class="form-hint">Use a value starting with "PAYEE-NEW" to simulate an unseen counterparty.</div>
          <div class="form-error">Payee ID is required.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-payeeInstitution">Payee Institution <span class="optional">(optional)</span></label>
          <input class="form-control" id="f-payeeInstitution" placeholder="e.g. Regional Trust" />
        </div>
        <div class="form-field">
          <label class="form-label" for="f-amount">Amount</label>
          <div class="input-affix">
            <span class="affix" id="f-amount-affix">$</span>
            <input class="form-control" id="f-amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </div>
          <div class="form-error">Enter an amount greater than 0.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-currency">Currency</label>
          <select class="form-control" id="f-currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-type">Type</label>
          <select class="form-control" id="f-type" required>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-status">Status <span class="optional">(optional)</span></label>
          <select class="form-control" id="f-status">
            <option value="">Auto (Completed)</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div class="form-field span-2">
          <label class="form-label" for="f-description">Description <span class="optional">(optional)</span></label>
          <textarea class="form-control" id="f-description" maxlength="255" placeholder="What is this transaction for?"></textarea>
        </div>
      </div>
      <p class="form-hint" style="margin-top: var(--space-3);">
        <i class="fa-solid fa-circle-info"></i>
        A known backend defect can cause transactions that trip a monitoring rule to report an error even though they were saved — see the warning toast and <span class="mono">frontend/README.md</span> if that happens.
      </p>
    </form>
  `;
}

function validateTxnForm(overlay) {
  let valid = true;
  const setInvalid = (fieldId, isInvalid) => {
    const field = overlay.querySelector(`#${fieldId}`).closest('.form-field');
    field.classList.toggle('invalid', isInvalid);
    if (isInvalid) valid = false;
  };
  setInvalid('f-accountId', !overlay.querySelector('#f-accountId').value);
  setInvalid('f-payeeId', !overlay.querySelector('#f-payeeId').value.trim());
  const amount = parseFloat(overlay.querySelector('#f-amount').value);
  setInvalid('f-amount', Number.isNaN(amount) || amount <= 0);
  return valid;
}

function openNewTransactionModal() {
  if (allAccounts.length === 0) {
    TxnSyncUI.Toast.error('No accounts available', 'Create an account before recording a transaction.');
    return;
  }
  const handle = TxnSyncUI.openModal({
    title: 'New Transaction',
    subtitle: 'Processes immediately and is evaluated against active monitoring rules',
    size: 'lg',
    bodyHtml: newTxnFormHtml(),
    footerHtml: `
      <button class="btn btn-secondary" data-cancel>Cancel</button>
      <button class="btn btn-primary" id="submitTxnBtn"><i class="fa-solid fa-paper-plane"></i> Process Transaction</button>
    `,
    onMount: (h) => {
      h.overlay.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.overlay.querySelector('#submitTxnBtn').addEventListener('click', () => submitNewTransaction(h));

      const currencySelect = h.overlay.querySelector('#f-currency');
      const affixEl = h.overlay.querySelector('#f-amount-affix');
      const updateAffix = () => { affixEl.textContent = TxnSyncUI.currencySymbol(currencySelect.value); };
      currencySelect.addEventListener('change', updateAffix);
      updateAffix();
    },
  });
}

/**
 * The backend never returns a generated transaction id (JdbcTransactionRepository.save()
 * doesn't capture the auto-increment key — see README "Known backend limitation"), and
 * when a rule triggers, the alert insert that follows fails its FK constraint and the
 * whole request 500s even though the transaction row was already committed. Both cases
 * are worked around here by re-fetching and matching on the submitted fields rather than
 * trusting the response.
 */
async function findRecentMatchingTransaction(payload, withinMs = 15000) {
  try {
    const list = await TxnSyncApi.TransactionsApi.list();
    const cutoff = Date.now() - withinMs;
    const candidates = list.filter((t) =>
      t.accountId === payload.accountId &&
      t.payeeId === payload.payeeId &&
      Number(t.amount) === Number(payload.amount) &&
      t.currency === payload.currency &&
      t.type === payload.type &&
      new Date(t.timestamp).getTime() >= cutoff
    );
    candidates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return candidates[0] || null;
  } catch (e) {
    return null;
  }
}

async function submitNewTransaction(handle) {
  const overlay = handle.overlay;
  if (!validateTxnForm(overlay)) return;

  const payload = {
    accountId: overlay.querySelector('#f-accountId').value,
    payeeId: overlay.querySelector('#f-payeeId').value.trim(),
    payeeInstitutionName: overlay.querySelector('#f-payeeInstitution').value.trim() || null,
    amount: parseFloat(overlay.querySelector('#f-amount').value),
    currency: overlay.querySelector('#f-currency').value,
    type: overlay.querySelector('#f-type').value,
    status: overlay.querySelector('#f-status').value || null,
    description: overlay.querySelector('#f-description').value.trim() || null,
  };

  const btn = overlay.querySelector('#submitTxnBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing…';

  try {
    const alertsBefore = await TxnSyncApi.AlertsApi.list().catch(() => []);
    let created = null;
    let alertCreationFailed = false;

    try {
      created = await TxnSyncApi.TransactionsApi.create(payload);
    } catch (createErr) {
      // Could be the known "rule triggered -> alert insert fails" defect. Check whether
      // the transaction landed anyway before treating this as a genuine failure.
      const recovered = await findRecentMatchingTransaction(payload);
      if (!recovered) throw createErr;
      created = recovered;
      alertCreationFailed = true;
    }

    if (!created.id) {
      const resolved = await findRecentMatchingTransaction(payload);
      if (resolved) created = resolved;
    }

    const alertsAfter = await TxnSyncApi.AlertsApi.list().catch(() => []);
    const newAlerts = alertsAfter.filter((a) => !alertsBefore.some((b) => b.id === a.id));
    const idLabel = created.id ? ` #${created.id}` : '';

    handle.close();
    if (alertCreationFailed) {
      TxnSyncUI.Toast.warning(
        `Transaction${idLabel} recorded`,
        'This tripped a monitoring rule, but the backend failed to create the resulting alert (a known backend defect — see frontend/README.md). The transaction itself was saved.'
      );
    } else if (newAlerts.length > 0) {
      TxnSyncUI.Toast.info(
        `Transaction${idLabel} processed`,
        `${newAlerts.length} monitoring alert${newAlerts.length > 1 ? 's' : ''} triggered — review on the Alerts page.`
      );
    } else {
      TxnSyncUI.Toast.success(`Transaction${idLabel} processed`, 'No monitoring rules were triggered.');
    }
    loadTransactions();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Process Transaction';
    TxnSyncUI.Toast.error('Could not process transaction', err.message);
  }
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadTransactions();

  document.getElementById('txnSearch').addEventListener('input', TxnSyncUI.debounce((e) => {
    txnTable.setSearchTerm(e.target.value);
  }, 200));

  document.getElementById('txnStatusFilter').addEventListener('change', (e) => {
    TXN_FILTERS.status = e.target.value;
    txnTable.setFilter(buildTxnFilterFn());
  });
  document.getElementById('txnTypeFilter').addEventListener('change', (e) => {
    TXN_FILTERS.type = e.target.value;
    txnTable.setFilter(buildTxnFilterFn());
  });
  document.getElementById('txnCurrencyFilter').addEventListener('change', (e) => {
    TXN_FILTERS.currency = e.target.value;
    txnTable.setFilter(buildTxnFilterFn());
  });

  document.getElementById('newTxnBtn').addEventListener('click', openNewTransactionModal);
});
