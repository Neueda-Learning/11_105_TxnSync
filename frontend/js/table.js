/**
 * TxnSync reusable DataTable — client-side search, sort, and pagination
 * over an in-memory array. The backend returns full collections with no
 * query params for this, so every list page drives one of these off real
 * API data.
 */

class DataTable {
  /**
   * @param {HTMLElement} container - empty element the table renders into
   * @param {Object} opts
   * @param {Array}  opts.columns - [{ key, label, sortable, align, render(row), sortValue(row) }]
   * @param {number} opts.pageSize
   * @param {Function} opts.rowKey - row => unique id
   * @param {Function} [opts.onRowClick] - row => void
   * @param {Function} [opts.searchMatch] - (row, term) => boolean, overrides default search
   * @param {Object}  opts.emptyState - { icon, title, desc, actionHtml }
   */
  constructor(container, opts) {
    this.container = container;
    this.opts = opts;
    this.rawData = [];
    this.filterFn = null;
    this.searchTerm = '';
    this.sortKey = opts.defaultSortKey || null;
    this.sortDir = opts.defaultSortDir || 'desc';
    this.page = 1;
    this.pageSize = opts.pageSize || 10;
    this.status = 'loading'; // loading | error | ready
    this.errorInfo = null;
    this._buildShell();
  }

  _buildShell() {
    this.container.innerHTML = `
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info"></div>
        <div class="pagination-controls"></div>
      </div>
    `;
    this.theadRow = this.container.querySelector('thead tr');
    this.tbody = this.container.querySelector('tbody');
    this.paginationInfo = this.container.querySelector('.pagination-info');
    this.paginationControls = this.container.querySelector('.pagination-controls');
    this._buildHead();
  }

  _buildHead() {
    this.theadRow.innerHTML = this.opts.columns.map((col) => {
      const active = this.sortKey === col.key;
      const icon = active ? (this.sortDir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : 'fa-sort';
      return `
        <th data-key="${col.key}" class="${col.sortable ? 'sortable' : ''} ${active ? 'sort-active' : ''}" style="${col.align ? `text-align:${col.align}` : ''}">
          ${TxnSyncUI.escapeHtml(col.label)}${col.sortable ? `<i class="fa-solid ${icon} sort-icon"></i>` : ''}
        </th>
      `;
    }).join('');

    this.theadRow.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (this.sortKey === key) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortDir = 'asc';
        }
        this._buildHead();
        this.page = 1;
        this._renderBody();
      });
    });
  }

  /** Swaps the column set (e.g. to hide a column that's null across every row) and re-renders. */
  setColumns(columns) {
    this.opts.columns = columns;
    this._buildHead();
    this._renderBody();
  }

  setLoading() {
    this.status = 'loading';
    this._renderBody();
  }

  setError(message, onRetry) {
    this.status = 'error';
    this.errorInfo = { message, onRetry };
    this._renderBody();
  }

  setData(data) {
    this.status = 'ready';
    this.rawData = Array.isArray(data) ? data : [];
    this.page = 1;
    this._renderBody();
  }

  setSearchTerm(term) {
    this.searchTerm = (term || '').trim().toLowerCase();
    this.page = 1;
    this._renderBody();
  }

  setFilter(fn) {
    this.filterFn = fn;
    this.page = 1;
    this._renderBody();
  }

  goToPage(n) {
    this.page = n;
    this._renderBody();
  }

  _defaultSearchMatch(row, term) {
    return Object.values(row).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(term));
  }

  _computeRows() {
    let rows = this.rawData;
    if (this.filterFn) rows = rows.filter(this.filterFn);
    if (this.searchTerm) {
      const match = this.opts.searchMatch || this._defaultSearchMatch;
      rows = rows.filter((r) => match(r, this.searchTerm));
    }
    if (this.sortKey) {
      const col = this.opts.columns.find((c) => c.key === this.sortKey);
      const getVal = (col && col.sortValue) || ((row) => row[this.sortKey]);
      rows = [...rows].sort((a, b) => {
        const va = getVal(a);
        const vb = getVal(b);
        let cmp;
        if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
        else cmp = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  _renderBody() {
    const colCount = this.opts.columns.length;

    if (this.status === 'loading') {
      TxnSyncUI.renderSkeletonRows(this.tbody, colCount, Math.min(this.pageSize, 6));
      this.paginationInfo.textContent = '';
      this.paginationControls.innerHTML = '';
      return;
    }

    if (this.status === 'error') {
      TxnSyncUI.renderTableMessageRow(this.tbody, colCount, {
        icon: 'fa-triangle-exclamation',
        title: 'Could not load data',
        desc: this.errorInfo?.message || 'Something went wrong.',
        danger: true,
        actionHtml: this.errorInfo?.onRetry ? '<button class="btn btn-secondary btn-sm" data-retry><i class="fa-solid fa-rotate-right"></i> Retry</button>' : '',
      });
      const retryBtn = this.tbody.querySelector('[data-retry]');
      if (retryBtn) retryBtn.addEventListener('click', () => this.errorInfo.onRetry());
      this.paginationInfo.textContent = '';
      this.paginationControls.innerHTML = '';
      return;
    }

    const rows = this._computeRows();
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.page > totalPages) this.page = totalPages;
    const start = (this.page - 1) * this.pageSize;
    const pageRows = rows.slice(start, start + this.pageSize);

    if (total === 0) {
      const es = this.opts.emptyState || { title: 'No records found' };
      TxnSyncUI.renderTableMessageRow(this.tbody, colCount, es);
      this.paginationInfo.textContent = '';
      this.paginationControls.innerHTML = '';
      return;
    }

    this.tbody.innerHTML = pageRows.map((row) => {
      const key = this.opts.rowKey(row);
      const clickable = !!this.opts.onRowClick;
      return `
        <tr data-key="${TxnSyncUI.escapeHtml(String(key))}" class="${clickable ? 'clickable' : ''}">
          ${this.opts.columns.map((col) => `<td style="${col.align ? `text-align:${col.align}` : ''}">${col.render(row)}</td>`).join('')}
        </tr>
      `;
    }).join('');

    if (this.opts.onRowClick) {
      this.tbody.querySelectorAll('tr[data-key]').forEach((tr) => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-stop-row-click]')) return;
          const row = pageRows.find((r) => String(this.opts.rowKey(r)) === tr.dataset.key);
          this.opts.onRowClick(row);
        });
      });
    }

    this.paginationInfo.textContent = `Showing ${start + 1}–${Math.min(start + this.pageSize, total)} of ${total}`;
    this._renderPagination(totalPages);
  }

  _renderPagination(totalPages) {
    const btn = (label, page, opts = {}) => `
      <button class="page-btn ${opts.active ? 'active' : ''}" ${opts.disabled ? 'disabled' : ''} data-page="${page}">${label}</button>
    `;
    let html = '';
    html += btn('<i class="fa-solid fa-angle-left"></i>', this.page - 1, { disabled: this.page === 1 });

    const windowSize = 5;
    let startPage = Math.max(1, this.page - Math.floor(windowSize / 2));
    let endPage = Math.min(totalPages, startPage + windowSize - 1);
    startPage = Math.max(1, endPage - windowSize + 1);

    if (startPage > 1) {
      html += btn('1', 1);
      if (startPage > 2) html += `<span class="text-muted" style="padding:0 4px;">…</span>`;
    }
    for (let p = startPage; p <= endPage; p++) html += btn(String(p), p, { active: p === this.page });
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="text-muted" style="padding:0 4px;">…</span>`;
      html += btn(String(totalPages), totalPages);
    }

    html += btn('<i class="fa-solid fa-angle-right"></i>', this.page + 1, { disabled: this.page === totalPages });
    this.paginationControls.innerHTML = html;
    this.paginationControls.querySelectorAll('.page-btn:not(:disabled)').forEach((b) => {
      b.addEventListener('click', () => this.goToPage(Number(b.dataset.page)));
    });
  }
}

window.DataTable = DataTable;
