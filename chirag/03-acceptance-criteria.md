# Agile Acceptance Criteria

This document defines the Given-When-Then (Gherkin format) Acceptance Criteria for validating user story implementations.

---

## 🎯 Acceptance Criteria Matrix

### AC-US001: Transaction Monitoring & Ingestion
* **Given** a new financial transaction payload is received via REST API,
* **When** the transaction is ingested by `TransactionService`,
* **Then** it must be persisted with a unique ID, timestamp, currency symbol, and initial status `PENDING` or `COMPLETED`.

### AC-US002: Multi-Currency Rule Evaluation
* **Given** a rule defined in USD with a threshold of `$10,000`,
* **When** a transaction of `€9,500` is processed,
* **Then** `RuleService` must call `CurrencyRateApi`, convert `€9,500` to USD (e.g. `$10,450`), evaluate against threshold, and trigger an Alert.

### AC-US003: Auto-Acknowledgment on Alert Open
* **Given** an alert in `OPEN` status,
* **When** an analyst clicks to view the alert details in the UI modal,
* **Then** the UI must send an API update transitioning status to `ACKNOWLEDGED` without requiring a manual button click.

### AC-US004: Tri-Theme Switcher (Light, Dark, Pink)
* **Given** the user is navigating the dashboard,
* **When** the user clicks the theme toggle button for Light, Dark, or Pink,
* **Then** the CSS variables on `<body>` update immediately, and the choice is persisted in `localStorage`.

### AC-US005: Accessibility Control Panel
* **Given** the accessibility panel is toggled open,
* **When** the user adjusts text scaling or toggles high-contrast mode,
* **Then** the interface re-renders text dynamically and adjusts contrast ratios without overlaying or obscuring main screen content.

### AC-US006: Dashboard Analytics Charts
* **Given** transactions and alerts exist in the database,
* **When** the user loads `dashboard.html`,
* **Then** Chart.js renders 3 interactive charts (Alert Lifecycle Pie Chart, Rule-Type Bar Chart, and Volume-vs-Alerts Timeline Chart) with live data.

### AC-US007: Global Exception Handling
* **Given** a request for a non-existent Resource ID (e.g. `/api/transactions/9999`),
* **When** `TransactionController` throws a `ResourceNotFoundException`,
* **Then** `GlobalExceptionHandler` intercepts it and returns `HTTP 404` with a JSON payload `{ "timestamp", "status": 404, "error": "Not Found", "message" }`.

### AC-US008: Docker Compose Zero-Config Stack
* **Given** Docker and Docker Compose installed on host machine,
* **When** executing `docker-compose up`,
* **Then** Backend starts on port `8082`, Frontend starts on port `8083`, and services establish successful DB connections automatically.
