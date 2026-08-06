/**
 * TxnSync API service layer.
 * Thin fetch wrapper + one function per backend endpoint. Nothing in this
 * file touches the DOM — pages/modules consume it and render results.
 */

const API_BASE_URL = 'http://localhost:8080/api/v1';

class ApiError extends Error {
  constructor(message, { status = null, isNetworkError = false, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.payload = payload;
  }
}

/**
 * Core request helper. Spring Boot's default error body is
 * {timestamp, status, error, path} with no guaranteed "message" field,
 * so we fall back through whatever's available for a readable string.
 */
async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      'Could not reach the TxnSync API. Is the backend running on ' + API_BASE_URL + '?',
      { isNetworkError: true }
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (raw && typeof raw === 'object' && (raw.message || raw.error)) ||
      (typeof raw === 'string' && raw) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, { status: response.status, payload: raw });
  }

  return raw;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const patch = (path, body) => request('PATCH', path, body);

/** Returns null on 404 instead of throwing — used for single-resource lookups. */
async function getOrNull(path) {
  try {
    return await get(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

const AccountsApi = {
  list: () => get('/accounts'),
  getById: (accountId) => getOrNull(`/accounts/${encodeURIComponent(accountId)}`),
  create: (account) => post('/accounts', account),
};

const TransactionsApi = {
  list: () => get('/transactions'),
  getById: (id) => getOrNull(`/transactions/${id}`),
  create: (transaction) => post('/transactions', transaction),
};

const RulesApi = {
  list: (activeOnly = false) => get(`/rules?activeOnly=${activeOnly}`),
  getById: (id) => getOrNull(`/rules/${id}`),
  update: (id, rule) => put(`/rules/${id}`, rule),
};

const AlertsApi = {
  list: () => get('/alerts'),
  getById: (id) => getOrNull(`/alerts/${id}`),
  create: (alert) => post('/alerts', alert),
  updateStatus: (id, status, resolutionNotes) => patch(`/alerts/${id}/status`, { status, resolutionNotes }),
};

/** Spring Boot Actuator is on the classpath, so /actuator/health is a free, cheap connectivity probe. */
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const HealthApi = {
  check: async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_ORIGIN}/actuator/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return false;
      const body = await res.json().catch(() => null);
      return !body || body.status === 'UP';
    } catch (e) {
      return false;
    }
  },
};

window.TxnSyncApi = { ApiError, AccountsApi, TransactionsApi, RulesApi, AlertsApi, HealthApi, API_BASE_URL };
