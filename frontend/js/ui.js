/**
 * TxnSync UI kit: toasts, modals, formatters, badge helpers, and
 * loading/empty/error state renderers shared by every page.
 */

/* ---------------- Escaping / formatting ---------------- */

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  } catch (e) {
    return `${num.toFixed(2)} ${currency}`;
  }
}

function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function parseServerDate(value) {
  if (!value) return null;
  // Spring serializes LocalDateTime without a timezone offset (e.g. 2026-08-04T10:15:30);
  // treat it as local time rather than letting the Date parser assume UTC.
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value) {
  const d = parseServerDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDate(value) {
  const d = parseServerDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(value) {
  const d = parseServerDate(value);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'just now';
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs) {
      const n = Math.floor(abs / secs);
      const suffix = diffSec >= 0 ? 'ago' : 'from now';
      return `${n} ${unit}${n > 1 ? 's' : ''} ${suffix}`;
    }
  }
  return 'just now';
}

function titleCase(value) {
  if (!value) return '';
  return String(value).toLowerCase().replace(/(^|\s|_)\w/g, (c) => c.toUpperCase()).replace(/_/g, ' ');
}

function debounce(fn, wait = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ---------------- Badge helpers ---------------- */

const BADGE_TONES = {
  txnStatus: { COMPLETED: 'success', PENDING: 'warning', FAILED: 'danger', REVERSED: 'neutral', CANCELLED: 'neutral' },
  alertStatus: { OPEN: 'danger', ACKNOWLEDGED: 'warning', RESOLVED: 'success', DISMISSED: 'neutral' },
  severity: { LOW: 'info', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' },
};

function toneFor(category, value) {
  const key = (value || '').toUpperCase();
  return (BADGE_TONES[category] && BADGE_TONES[category][key]) || 'neutral';
}

function badgeHtml(label, tone = 'neutral', plain = false) {
  return `<span class="badge badge-${tone}${plain ? ' badge-plain' : ''}">${escapeHtml(label)}</span>`;
}

function statusBadge(category, value) {
  if (!value) return badgeHtml('Unknown', 'neutral');
  return badgeHtml(titleCase(value), toneFor(category, value));
}

/* ---------------- Toasts ---------------- */

function getToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

const TOAST_ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };

function showToast({ type = 'info', title, desc = '', duration = 4200 }) {
  const stack = getToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${desc ? `<div class="toast-desc">${escapeHtml(desc)}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
  `;
  const remove = () => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 200);
  };
  toast.querySelector('.toast-close').addEventListener('click', remove);
  stack.appendChild(toast);
  if (duration) setTimeout(remove, duration);
  return { remove };
}

const Toast = {
  success: (title, desc) => showToast({ type: 'success', title, desc }),
  error: (title, desc) => showToast({ type: 'error', title, desc }),
  info: (title, desc) => showToast({ type: 'info', title, desc }),
  warning: (title, desc) => showToast({ type: 'warning', title, desc, duration: 6500 }),
};

/* ---------------- Modal ---------------- */

function openModal({ title, subtitle = '', bodyHtml = '', footerHtml = '', size = '', onMount = null, onClose = null }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size === 'lg' ? 'modal-lg' : ''}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button class="modal-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function close() {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 220);
    document.removeEventListener('keydown', onKeydown);
    if (onClose) onClose();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.modal-close').addEventListener('click', close);
  document.addEventListener('keydown', onKeydown);

  requestAnimationFrame(() => overlay.classList.add('visible'));

  const handle = { overlay, modalEl: overlay.querySelector('.modal'), close };
  if (onMount) onMount(handle);
  return handle;
}

/* ---------------- State renderers (loading / empty / error) ---------------- */

function renderSkeletonRows(tbody, columnCount, rowCount = 6) {
  tbody.innerHTML = Array.from({ length: rowCount }).map(() => `
    <tr class="skeleton-row">
      ${Array.from({ length: columnCount }).map(() => `<td><div class="skeleton skeleton-line" style="width:${60 + Math.random() * 30}%"></div></td>`).join('')}
    </tr>
  `).join('');
}

function renderTableMessageRow(tbody, columnCount, { icon = 'fa-inbox', title, desc = '', actionHtml = '', danger = false }) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${columnCount}">
        <div class="state-block">
          <div class="state-icon ${danger ? 'danger' : 'neutral'}"><i class="fa-solid ${icon}"></i></div>
          <div class="state-title">${escapeHtml(title)}</div>
          ${desc ? `<div class="state-desc">${escapeHtml(desc)}</div>` : ''}
          ${actionHtml || ''}
        </div>
      </td>
    </tr>
  `;
}

function renderBlockState(container, { icon = 'fa-inbox', title, desc = '', actionHtml = '', danger = false }) {
  container.innerHTML = `
    <div class="state-block">
      <div class="state-icon ${danger ? 'danger' : 'neutral'}"><i class="fa-solid ${icon}"></i></div>
      <div class="state-title">${escapeHtml(title)}</div>
      ${desc ? `<div class="state-desc">${escapeHtml(desc)}</div>` : ''}
      ${actionHtml || ''}
    </div>
  `;
}

window.TxnSyncUI = {
  escapeHtml, formatCurrency, formatNumber, formatDate, formatDateTime, formatRelativeTime,
  titleCase, debounce, statusBadge, badgeHtml, toneFor,
  Toast, openModal,
  renderSkeletonRows, renderTableMessageRow, renderBlockState,
};
