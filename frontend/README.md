# TxnSync Frontend

A vanilla HTML5 / CSS3 / ES6+ dashboard for the TxnSync Spring Boot API. No build step, no framework — open it in a browser (via a static server) once the backend is running.

## Running it

1. Start the backend (from `backend/txnSync`): `mvn spring-boot:run` — it listens on `http://localhost:8080`.
2. Serve the `frontend/` folder with any static file server, for example:
   - VS Code "Live Server" extension → right-click `index.html` → "Open with Live Server"
   - `npx serve frontend`
   - `py -m http.server 5500` (run from inside `frontend/`), then open `http://localhost:5500`
3. The app opens straight into the dashboard — there's no login, matching the backend, which has no auth.

The API base URL is a single constant at the top of [js/api.js](js/api.js) (`API_BASE_URL`, default `http://localhost:8080/api/v1`) — change it there if the backend runs elsewhere.

## Known limitation: CORS

The backend has no CORS configuration, and this build intentionally leaves the backend untouched. Since the frontend is served from its own origin (e.g. `localhost:5500`) while the API is on `localhost:8080`, the browser will block the responses — you'll see toasts/banners saying **"Could not reach the TxnSync API"** even though the backend is up and reachable via curl or Postman. That message covers both a genuinely offline backend and a CORS block; check the browser's Network/Console tab to tell them apart (a CORS block shows the request completing with a CORS error, not a connection failure).

To actually exercise the app against the live backend during local development, run Chrome with web security disabled in a throwaway profile (development only — never browse the regular web with this):

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --disable-web-security `
  --user-data-dir="$env:TEMP\txnsync-dev-chrome"
```

Then open your static server's URL (e.g. `http://localhost:5500`) in that window.

## Folder structure

```
frontend/
├── index.html              # redirects straight into dashboard.html (no login)
├── dashboard.html           # overview: stat cards, breakdowns, recent activity
├── pages/
│   ├── transactions.html    # search/filter/sort/paginate + new transaction + detail modal
│   ├── accounts.html        # search/sort/paginate + new account + detail modal
│   ├── rules.html           # search/filter/sort/paginate + inline toggle + edit modal
│   └── alerts.html          # search/filter/sort/paginate + detail modal + status workflow
├── css/
│   ├── style.css             # design tokens, reset, app shell (sidebar/header)
│   ├── components.css        # buttons, forms, tables, badges, modals, toasts, states
│   └── dashboard.css         # stat cards, breakdown bars, donut, activity feed
├── js/
│   ├── api.js                 # fetch wrapper + one function per backend endpoint
│   ├── ui.js                  # toasts, modals, formatters, badges, empty/error/loading states
│   ├── table.js                # reusable DataTable: client-side search/sort/pagination
│   ├── layout.js               # injects sidebar/header, active nav, connectivity indicator
│   ├── dashboard.js
│   ├── transactions.js
│   ├── accounts.js
│   ├── rules.js
│   └── alerts.js
└── assets/
    └── favicon.svg
```

## What maps to what

Every screen only exposes what the backend actually supports — there's no create/delete for rules and no update/delete for accounts because those endpoints don't exist:

| Page | Backend endpoints used |
|---|---|
| Dashboard | `GET /transactions`, `GET /accounts`, `GET /rules`, `GET /alerts` (all four, aggregated client-side — there's no stats endpoint) |
| Transactions | `GET /transactions`, `GET /transactions/{id}`, `POST /transactions`, `GET /accounts` (for the account picker) |
| Accounts | `GET /accounts`, `POST /accounts`, `GET /transactions` (for per-account activity stats) |
| Rules | `GET /rules`, `GET /rules/{id}`, `PUT /rules/{id}` |
| Alerts | `GET /alerts`, `GET /rules` + `GET /transactions` (to join rule/transaction context), `PATCH /alerts/{id}/status` |

Search, filtering, sorting, and pagination are all implemented client-side in `js/table.js`, since the list endpoints return full collections with no query parameters for any of that.
