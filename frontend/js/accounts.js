

let accTable = null;
let allAccountsList = [];
let allTxnsForAccounts = [];
const ACC_FILTERS = { institution: '' };

function accountStats(accountId) {
  const txns = allTxnsForAccounts.filter((t) => t.accountId === accountId);
  const byCurrency = {};
  txns.forEach((t) => {
    const cur = t.currency || 'USD';
    byCurrency[cur] = (byCurrency[cur] || 0) + (Number(t.amount) || 0);
  });
  const lastTxn = txns.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  return { count: txns.length, byCurrency, lastTxn, txns };
}

function buildAccFilterFn() {
  return (row) => {
    if (ACC_FILTERS.institution && row.institutionName !== ACC_FILTERS.institution) return false;
    return true;
  };
}

function accColumns() {
  return [
    {
      key: 'accountId', label: 'Account ID', sortable: true, sortValue: (r) => r.accountId,
      render: (r) => `<span class="cell-mono cell-primary">${TxnSyncUI.escapeHtml(r.accountId)}</span>`,
    },
    {
      key: 'accountName', label: 'Account Holder', sortable: true, sortValue: (r) => r.accountName || '',
      render: (r) => `<div class="cell-primary">${TxnSyncUI.escapeHtml(r.accountName)}</div>`,
    },
    {
      key: 'institutionName', label: 'Institution', sortable: true, sortValue: (r) => r.institutionName || '',
      render: (r) => r.institutionName ? TxnSyncUI.escapeHtml(r.institutionName) : '<span class="text-muted">—</span>',
    },
    {
      key: 'activity', label: 'Activity',
      render: (r) => {
        const stats = accountStats(r.accountId);
        if (stats.count === 0) return '<span class="text-muted cell-secondary">No transactions</span>';
        const volumeText = Object.entries(stats.byCurrency).map(([cur, sum]) => TxnSyncUI.formatCurrency(sum, cur)).join(' · ');
        return `<div class="cell-primary">${stats.count} txn${stats.count === 1 ? '' : 's'}</div><div class="cell-secondary">${volumeText}</div>`;
      },
    },
    {
      key: 'createdAt', label: 'Created', sortable: true, sortValue: (r) => new Date(r.createdAt).getTime() || 0,
      render: (r) => `
        <div>${TxnSyncUI.formatDate(r.createdAt)}</div>
        <div class="cell-secondary">${TxnSyncUI.formatRelativeTime(r.createdAt)}</div>
      `,
    },
  ];
}

function initTable() {
  accTable = new DataTable(document.getElementById('accTableContainer'), {
    columns: accColumns(),
    pageSize: 10,
    defaultSortKey: 'createdAt',
    defaultSortDir: 'desc',
    rowKey: (r) => r.accountId,
    onRowClick: (row) => openAccountDetailModal(row),
    emptyState: {
      icon: 'fa-building-columns', title: 'No accounts found',
      desc: 'Try adjusting your search, or create the first account.',
    },
  });
  accTable.setLoading();
}

function populateInstitutionFilter(accounts) {
  const select = document.getElementById('accInstitutionFilter');
  const institutions = [...new Set(accounts.map((a) => a.institutionName).filter(Boolean))].sort();
  select.querySelectorAll('option:not(:first-child)').forEach((o) => o.remove());
  institutions.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

async function loadAccounts() {
  accTable?.setLoading();
  try {
    const [accounts, transactions] = await Promise.all([
      TxnSyncApi.AccountsApi.list(),
      TxnSyncApi.TransactionsApi.list(),
    ]);
    allAccountsList = accounts;
    allTxnsForAccounts = transactions;
    populateInstitutionFilter(accounts);
    accTable.setData(accounts);
  } catch (err) {
    accTable.setError(err.message, loadAccounts);
    TxnSyncUI.Toast.error('Failed to load accounts', err.message);
  }
}

/* ---------------- Detail modal ---------------- */

function accountDetailBodyHtml(a) {
  const stats = accountStats(a.accountId);
  const volumeText = Object.keys(stats.byCurrency).length
    ? Object.entries(stats.byCurrency).map(([cur, sum]) => TxnSyncUI.formatCurrency(sum, cur)).join(' · ')
    : '—';
  const recentRows = stats.txns.slice().sort((a2, b2) => new Date(b2.timestamp) - new Date(a2.timestamp)).slice(0, 5);

  return `
    <div class="detail-grid">
      <div class="detail-item"><label>Account ID</label><div class="value mono">${TxnSyncUI.escapeHtml(a.accountId)}</div></div>
      <div class="detail-item"><label>Account Holder</label><div class="value">${TxnSyncUI.escapeHtml(a.accountName)}</div></div>
      <div class="detail-item"><label>Institution</label><div class="value">${TxnSyncUI.escapeHtml(a.institutionName || '—')}</div></div>
      <div class="detail-item"><label>Created</label><div class="value">${TxnSyncUI.formatDateTime(a.createdAt)}</div></div>
      <div class="detail-item"><label>Transaction Count</label><div class="value">${stats.count}</div></div>
      <div class="detail-item"><label>Total Volume</label><div class="value">${volumeText}</div></div>
    </div>
    <div class="detail-divider" style="margin: var(--space-5) 0;"></div>
    <div class="section-heading" style="margin-bottom: var(--space-3);"><h2 style="font-size:13px;">Recent Transactions</h2></div>
    ${recentRows.length === 0 ? `<p class="text-secondary" style="font-size:12.5px;">No transactions recorded for this account yet.</p>` : `
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th scope="col">Transaction</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Time</th></tr></thead>
          <tbody>
            ${recentRows.map((t) => `
              <tr>
                <td><div class="cell-primary">${TxnSyncUI.escapeHtml(t.description || t.payeeId)}</div><div class="cell-secondary">to ${TxnSyncUI.escapeHtml(t.payeeId)}</div></td>
                <td>${TxnSyncUI.formatCurrency(t.amount, t.currency)}</td>
                <td>${TxnSyncUI.statusBadge('txnStatus', t.status)}</td>
                <td class="cell-secondary">${TxnSyncUI.formatRelativeTime(t.timestamp)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function openAccountDetailModal(row) {
  TxnSyncUI.openModal({
    title: row.accountName,
    subtitle: row.accountId,
    size: 'lg',
    bodyHtml: accountDetailBodyHtml(row),
    footerHtml: `<button class="btn btn-secondary" data-close>Close</button>`,
    onMount: (h) => h.overlay.querySelector('[data-close]').addEventListener('click', h.close),
  });
}

/* ---------------- New Account modal ---------------- */

function newAccountFormHtml() {
  return `
    <form id="newAccountForm" novalidate>
      <div class="form-grid single">
        <div class="form-field">
          <label class="form-label" for="f-accId">Account ID</label>
          <input class="form-control" id="f-accId" placeholder="e.g. ACC-004" required />
          <div class="form-hint">Must be unique across the network.</div>
          <div class="form-error">Enter a unique account ID.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-accName">Account Holder Name</label>
          <input class="form-control" id="f-accName" placeholder="e.g. Dana Whitfield" required />
          <div class="form-error">Account holder name is required.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-accInstitution">Institution <span class="optional">(optional)</span></label>
          <input class="form-control" id="f-accInstitution" placeholder="e.g. TxnSync Bank" />
        </div>
      </div>
    </form>
  `;
}

function validateAccountForm(overlay) {
  let valid = true;
  const setInvalid = (fieldId, isInvalid) => {
    const field = overlay.querySelector(`#${fieldId}`).closest('.form-field');
    field.classList.toggle('invalid', isInvalid);
    if (isInvalid) valid = false;
  };
  const accId = overlay.querySelector('#f-accId').value.trim();
  const duplicate = allAccountsList.some((a) => a.accountId.toLowerCase() === accId.toLowerCase());
  setInvalid('f-accId', !accId || duplicate);
  if (duplicate) overlay.querySelector('#f-accId').closest('.form-field').querySelector('.form-error').textContent = 'That account ID already exists.';
  setInvalid('f-accName', !overlay.querySelector('#f-accName').value.trim());
  return valid;
}

function openNewAccountModal() {
  const handle = TxnSyncUI.openModal({
    title: 'New Account',
    subtitle: 'Register an account in the monitoring network',
    bodyHtml: newAccountFormHtml(),
    footerHtml: `
      <button class="btn btn-secondary" data-cancel>Cancel</button>
      <button class="btn btn-primary" id="submitAccBtn"><i class="fa-solid fa-plus"></i> Create Account</button>
    `,
    onMount: (h) => {
      h.overlay.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.overlay.querySelector('#submitAccBtn').addEventListener('click', () => submitNewAccount(h));
    },
  });
}

async function submitNewAccount(handle) {
  const overlay = handle.overlay;
  if (!validateAccountForm(overlay)) return;

  const payload = {
    accountId: overlay.querySelector('#f-accId').value.trim(),
    accountName: overlay.querySelector('#f-accName').value.trim(),
    institutionName: overlay.querySelector('#f-accInstitution').value.trim() || null,
  };

  const btn = overlay.querySelector('#submitAccBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating…';

  try {
    const created = await TxnSyncApi.AccountsApi.create(payload);
    handle.close();
    TxnSyncUI.Toast.success('Account created', `${created.accountName} (${created.accountId}) is now active.`);
    loadAccounts();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plus"></i> Create Account';
    TxnSyncUI.Toast.error('Could not create account', err.message);
  }
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadAccounts();

  document.getElementById('accSearch').addEventListener('input', TxnSyncUI.debounce((e) => {
    accTable.setSearchTerm(e.target.value);
  }, 200));

  document.getElementById('accInstitutionFilter').addEventListener('change', (e) => {
    ACC_FILTERS.institution = e.target.value;
    accTable.setFilter(buildAccFilterFn());
  });

  document.getElementById('newAccountBtn').addEventListener('click', openNewAccountModal);
});
