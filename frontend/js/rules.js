/**
 * Rules page — table (search/filter/sort/pagination), inline active/inactive
 * toggle, and an edit modal wired to PUT /api/v1/rules/{id} (the only write
 * endpoint the Rule API exposes — there is no create or delete).
 */

let ruleTable = null;
let allRules = [];
const RULE_FILTERS = { status: '', severity: '' };

const RULE_TYPE_LABELS = { AMOUNT: 'Amount Threshold', VELOCITY: 'Velocity', NEW_PAYEE: 'New Payee', DAILY_LIMIT: 'Daily Limit' };

function buildRuleFilterFn() {
  return (row) => {
    if (RULE_FILTERS.status === 'active' && !row.active) return false;
    if (RULE_FILTERS.status === 'inactive' && row.active) return false;
    if (RULE_FILTERS.severity && (row.severity || '').toUpperCase() !== RULE_FILTERS.severity) return false;
    return true;
  };
}

function ruleColumns() {
  return [
    {
      key: 'ruleName', label: 'Rule', sortable: true, sortValue: (r) => r.ruleName || '',
      render: (r) => `
        <div class="cell-primary">${TxnSyncUI.escapeHtml(r.ruleName)}</div>
        <div class="cell-secondary">${TxnSyncUI.escapeHtml(RULE_TYPE_LABELS[r.ruleType] || r.ruleType)}</div>
      `,
    },
    { key: 'severity', label: 'Severity', sortable: true, sortValue: (r) => r.severity || '', render: (r) => TxnSyncUI.statusBadge('severity', r.severity) },
    {
      key: 'thresholdAmount', label: 'Threshold', sortable: true, sortValue: (r) => Number(r.thresholdAmount) || 0,
      render: (r) => r.thresholdAmount != null ? TxnSyncUI.formatCurrency(r.thresholdAmount, 'USD') : '<span class="text-muted">—</span>',
    },
    {
      key: 'window', label: 'Window / Count',
      render: (r) => {
        if (r.timeWindowMinutes == null && r.transactionCount == null) return '<span class="text-muted">—</span>';
        return `${r.timeWindowMinutes != null ? r.timeWindowMinutes + ' min' : '—'} / ${r.transactionCount != null ? r.transactionCount + ' txns' : '—'}`;
      },
    },
    {
      key: 'active', label: 'Active', sortable: true, sortValue: (r) => (r.active ? 1 : 0),
      render: (r) => `
        <label class="switch" data-stop-row-click>
          <input type="checkbox" data-toggle-rule="${r.id}" ${r.active ? 'checked' : ''} />
          <span class="switch-track"></span>
        </label>
      `,
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => `
        <div class="cell-actions" data-stop-row-click>
          <button class="btn btn-secondary btn-sm btn-icon" data-edit-rule="${r.id}" title="Edit rule"><i class="fa-solid fa-pen"></i></button>
        </div>
      `,
    },
  ];
}

function initTable() {
  ruleTable = new DataTable(document.getElementById('ruleTableContainer'), {
    columns: ruleColumns(),
    pageSize: 10,
    defaultSortKey: 'severity',
    defaultSortDir: 'desc',
    rowKey: (r) => r.id,
    onRowClick: (row) => openEditRuleModal(row),
    emptyState: {
      icon: 'fa-shield-halved', title: 'No rules found',
      desc: 'Try adjusting your search or filters.',
    },
  });
  ruleTable.setLoading();
}

function wireRowControls() {
  const container = document.getElementById('ruleTableContainer');
  container.addEventListener('change', (e) => {
    const toggle = e.target.closest('[data-toggle-rule]');
    if (toggle) toggleRuleActive(Number(toggle.dataset.toggleRule), toggle);
  });
  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-rule]');
    if (editBtn) {
      const rule = allRules.find((r) => r.id === Number(editBtn.dataset.editRule));
      if (rule) openEditRuleModal(rule);
    }
  });
}

async function loadRules() {
  ruleTable?.setLoading();
  try {
    const rules = await TxnSyncApi.RulesApi.list(false);
    allRules = rules;
    ruleTable.setData(rules);
  } catch (err) {
    ruleTable.setError(err.message, loadRules);
    TxnSyncUI.Toast.error('Failed to load rules', err.message);
  }
}

async function toggleRuleActive(id, checkboxEl) {
  const rule = allRules.find((r) => r.id === id);
  if (!rule) return;
  const nextState = checkboxEl.checked;
  checkboxEl.disabled = true;
  try {
    const updated = await TxnSyncApi.RulesApi.update(id, { ...rule, active: nextState });
    rule.active = updated.active;
    TxnSyncUI.Toast.success(`${rule.ruleName} ${nextState ? 'activated' : 'deactivated'}`);
    ruleTable.setData(allRules);
  } catch (err) {
    checkboxEl.checked = !nextState;
    TxnSyncUI.Toast.error('Could not update rule', err.message);
  } finally {
    checkboxEl.disabled = false;
  }
}

/* ---------------- Edit modal ---------------- */

function editRuleFormHtml(r) {
  return `
    <form id="editRuleForm" novalidate>
      <div class="form-grid">
        <div class="form-field span-2">
          <label class="form-label" for="f-ruleName">Rule Name</label>
          <input class="form-control" id="f-ruleName" value="${TxnSyncUI.escapeHtml(r.ruleName)}" required />
          <div class="form-error">Rule name is required.</div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-ruleType">Rule Type</label>
          <select class="form-control" id="f-ruleType">
            ${Object.entries(RULE_TYPE_LABELS).map(([val, label]) => `<option value="${val}" ${r.ruleType === val ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-severity">Severity</label>
          <select class="form-control" id="f-severity">
            ${['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => `<option value="${s}" ${r.severity === s ? 'selected' : ''}>${TxnSyncUI.titleCase(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-threshold">Threshold Amount <span class="optional">(optional)</span></label>
          <div class="input-affix">
            <span class="affix">$</span>
            <input class="form-control" id="f-threshold" type="number" min="0" step="0.01" value="${r.thresholdAmount ?? ''}" />
          </div>
        </div>
        <div class="form-field">
          <label class="form-label" for="f-window">Time Window (minutes) <span class="optional">(optional)</span></label>
          <input class="form-control" id="f-window" type="number" min="0" value="${r.timeWindowMinutes ?? ''}" />
        </div>
        <div class="form-field span-2">
          <label class="form-label" for="f-txnCount">Transaction Count <span class="optional">(optional)</span></label>
          <input class="form-control" id="f-txnCount" type="number" min="0" value="${r.transactionCount ?? ''}" />
        </div>
        <div class="form-field span-2">
          <label class="switch">
            <input type="checkbox" id="f-isActive" ${r.active ? 'checked' : ''} />
            <span class="switch-track"></span>
          </label>
          <span style="font-size:12.5px;font-weight:600;margin-left:4px;">Rule is active</span>
        </div>
      </div>
    </form>
  `;
}

function openEditRuleModal(rule) {
  const handle = TxnSyncUI.openModal({
    title: 'Edit Rule',
    subtitle: `Rule #${rule.id}`,
    bodyHtml: editRuleFormHtml(rule),
    footerHtml: `
      <button class="btn btn-secondary" data-cancel>Cancel</button>
      <button class="btn btn-primary" id="submitRuleBtn"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
    `,
    onMount: (h) => {
      h.overlay.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.overlay.querySelector('#submitRuleBtn').addEventListener('click', () => submitEditRule(h, rule));
    },
  });
}

async function submitEditRule(handle, original) {
  const overlay = handle.overlay;
  const nameField = overlay.querySelector('#f-ruleName');
  const nameValid = !!nameField.value.trim();
  nameField.closest('.form-field').classList.toggle('invalid', !nameValid);
  if (!nameValid) return;

  const toNumOrNull = (v) => (v === '' || v === null ? null : Number(v));
  const payload = {
    id: original.id,
    ruleName: nameField.value.trim(),
    ruleType: overlay.querySelector('#f-ruleType').value,
    severity: overlay.querySelector('#f-severity').value,
    thresholdAmount: toNumOrNull(overlay.querySelector('#f-threshold').value),
    timeWindowMinutes: toNumOrNull(overlay.querySelector('#f-window').value),
    transactionCount: toNumOrNull(overlay.querySelector('#f-txnCount').value),
    active: overlay.querySelector('#f-isActive').checked,
  };

  const btn = overlay.querySelector('#submitRuleBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

  try {
    await TxnSyncApi.RulesApi.update(original.id, payload);
    handle.close();
    TxnSyncUI.Toast.success('Rule updated', `${payload.ruleName} has been saved.`);
    loadRules();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    TxnSyncUI.Toast.error('Could not update rule', err.message);
  }
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  wireRowControls();
  loadRules();

  document.getElementById('ruleSearch').addEventListener('input', TxnSyncUI.debounce((e) => {
    ruleTable.setSearchTerm(e.target.value);
  }, 200));

  document.getElementById('ruleStatusFilter').addEventListener('change', (e) => {
    RULE_FILTERS.status = e.target.value;
    ruleTable.setFilter(buildRuleFilterFn());
  });
  document.getElementById('ruleSeverityFilter').addEventListener('change', (e) => {
    RULE_FILTERS.severity = e.target.value;
    ruleTable.setFilter(buildRuleFilterFn());
  });
});
