# TxnSync

TxnSync is a transaction monitoring app: a Spring Boot + MySQL backend that stores accounts, transactions, monitoring rules, and the alerts those rules trigger, paired with a vanilla HTML/CSS/JS dashboard for viewing and managing them.


## Project structure

```
.
├── backend/txnSync/       # Spring Boot REST API (Java 17, Maven)
│   └── src/main/java/com/finance/txnSync/
│       ├── controllers/    # REST endpoints (accounts, transactions, rules, alerts)
│       ├── services/       # Business logic (rule evaluation, alerting)
│       ├── repositories/   # JDBC data access
│       ├── models/         # Domain objects
│       └── config/         # CORS configuration
├── database/
│   ├── schema.sql          # Table definitions (accounts, transactions, rules, alerts)
│   └── data.sql            # Sample seed data
└── frontend/               # Static dashboard (no build step, no framework)
    ├── dashboard.html       # Overview: stat cards, breakdowns, recent activity
    └── pages/               # Transactions, accounts, rules, alerts screens
```

## What it does

- **Accounts** — linked bank accounts that transactions belong to.
- **Transactions** — debits/credits against an account, each with a payee, amount, currency, type, and status.
- **Rules** — monitoring conditions (e.g. amount threshold, new/unseen payee, transaction velocity, daily volume) that can be active or inactive.
- **Alerts** — automatically created when a processed transaction matches an active rule (e.g. a large transfer or a payee the account has never paid before); alerts move through an OPEN → ACKNOWLEDGED/INVESTIGATING → CLOSED workflow.

## Features

- **Dashboard overview** — stat cards (volume, linked accounts, active rules, open alerts), a transaction status breakdown, a transaction-type donut chart, recent transactions, and a recent alerts feed, all computed live from the API.
- **Transaction processing with rule evaluation** — every transaction submitted through `POST /api/v1/transactions` is checked against all active rules (amount threshold, new/unseen payee, velocity, daily volume) and automatically opens an alert when one matches.
- **Rule-based alerting workflow** — alerts carry a severity and move through `OPEN → ACKNOWLEDGED/INVESTIGATING → CLOSED`, with resolution notes and an acknowledged timestamp.
- **Accounts, Transactions, Rules, and Alerts pages** — each with client-side search, filtering, sortable columns, and pagination (via a shared `DataTable` component), plus:
  - **Transactions** — a "new transaction" form and a detail modal.
  - **Accounts** — a "new account" form and a detail modal.
  - **Rules** — an inline active/inactive toggle and an edit modal.
  - **Alerts** — a detail modal and status-update workflow (acknowledge/investigate/close, with notes).
- **No build step frontend** — plain HTML/CSS/ES6+, so any static file server works; no bundler, transpiler, or `npm install` required.
- **Environment-driven backend config** — port, database connection, and CORS origins are all overridable via environment variables without touching source (see the table below).
- **CORS configured out of the box** — `/api/**` and `/actuator/**` both have configurable allowed origins, so the static frontend can call the API from a different origin/port during local development.
- **Interactive API docs** — Swagger UI (via springdoc-openapi) for exploring and trying endpoints without a separate client.

## Tech stack

- **Backend:** Java 17, Spring Boot, Spring MVC, JDBC (`JdbcTemplate`) — no ORM/JPA, hand-written SQL repositories.
- **Database:** MySQL.
- **Frontend:** Plain HTML5/CSS3/ES6+, no framework and no build step — served as static files and talks to the backend over `fetch`.

## Prerequisites

- Java 17 or later
- Maven (or the included Maven Wrapper — `mvnw`/`mvnw.cmd`)
- MySQL Server
- Any static file server for the frontend (VS Code Live Server, `npx serve`, `python -m http.server`, etc.)

## 1. Database setup

Create the database, then load the schema and (optionally) the sample seed data:

```sql
CREATE DATABASE txn_sync_db;
```

```bash
mysql -u root -p txn_sync_db < database/schema.sql
mysql -u root -p txn_sync_db < database/data.sql   -- optional sample data
```

## 2. Backend configuration

Configuration lives in [backend/txnSync/src/main/resources/application.properties](backend/txnSync/src/main/resources/application.properties). Everything can be overridden with environment variables instead of editing the file:

| Property | Env var | Default |
|---|---|---|
| Server port | `PORT` | `8080` |
| Datasource URL | `DB_URL` | `jdbc:mysql://localhost:3306/txn_sync_db` |
| Datasource username | `DB_USER` | `root` |
| Datasource password | `DB_PASS` | — |
| API CORS origins (`/api/**`) | `APP_CORS_ORIGINS` | `*` |
| Actuator CORS origins | `ACTUATOR_ALLOWED_ORIGINS` | `http://127.0.0.1:5501,http://localhost:5501` |

> **Note:** Do not commit your personal database password to the repository — set `DB_PASS` in your environment instead of editing the checked-in default.

## 3. Running the backend

```bash
cd backend/txnSync
```

```bash
# Windows
mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`, with endpoints under `http://localhost:8080/api/v1/...`:

| Resource | Base path | Notes |
|---|---|---|
| Accounts | `/api/v1/accounts` | list, get by id, create |
| Transactions | `/api/v1/transactions` | list, get by id, create (triggers rule evaluation) |
| Rules | `/api/v1/rules` | list, get by id, update |
| Alerts | `/api/v1/alerts` | list, get by id, update status |

Health check: `http://localhost:8080/actuator/health`.
Interactive API docs (Swagger UI via springdoc-openapi): `http://localhost:8080/swagger-ui/index.html`.

## 4. Running the frontend

The `frontend/` folder is static — serve it with any static file server, for example:

```bash
# from the frontend/ folder
py -m http.server 5500
```

Then open `http://localhost:5500`. The frontend's API base URL is a single constant in [frontend/js/api.js](frontend/js/api.js) (`API_BASE_URL`) — update it if the backend isn't on `http://localhost:8080`. See [frontend/README.md](frontend/README.md) for more detail on the frontend, including known issues.

## Known limitations

- **No authentication** — every endpoint and every dashboard page is open.
- **No automated tests beyond a couple of smoke tests** in `backend/txnSync/src/test/`.
