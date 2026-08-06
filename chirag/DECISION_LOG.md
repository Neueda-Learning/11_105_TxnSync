# Internal Decision Log (ADR & Default Decisions)

This document logs key architectural choices, default design decisions, and technical trade-offs agreed upon during developer internal syncs and customer discovery sessions.

---

## 📌 ADR-01: Modular Documentation Architecture over Monolithic README
* **Date:** Sprint 2 Sync (Meeting 2, Item 7)
* **Status:** **Accepted & Implemented**
* **Context:** A single `README.md` was becoming cluttered with technical setup, customer meeting notes, Kanban boards, and build metrics.
* **Decision:** Split documentation into focused, dedicated files under the `/docs/` directory:
  * `01-feature-list.md`, `02-user-stories.md`, `03-acceptance-criteria.md`, `04-system-architecture.md`, `05-screen-flow.md`.
  * `MOM.md` for customer meeting logs.
  * `KANBAN.md` for task board tracking.
  * `TRACEABILITY_MATRIX.md` for requirement-to-code traceability.
  * `DECISION_LOG.md` for architectural decision records (ADRs).

---

## 📌 ADR-02: Alert Status Workflow & Lifecycle State Machine
* **Date:** Sprint 1 Review (Meeting 1)
* **Status:** **Accepted & Implemented**
* **Context:** Alerts initially allowed unrestricted creation and updates via POST endpoints, causing state inconsistencies.
* **Decision:** 
  1. Remove `POST` endpoint for manual alert creation (`PR #9`). Alerts can only be generated automatically by the rule evaluation engine.
  2. Enforce a strict state transition flow (`PR #10`):
     $$\text{System Open} \longrightarrow \text{Acknowledged} \longrightarrow \text{Investigating} \longrightarrow \text{Closed}$$

---

## 📌 ADR-03: Multi-Currency Rule Evaluation Integration
* **Date:** Sprint 2 Discovery (Meeting 2, Item 2)
* **Status:** **Accepted & Implemented**
* **Context:** Transactions occur in foreign currencies, but threshold evaluation rules were hardcoded to a single currency.
* **Decision:** Integrate a real-time Exchange Rate API (`PR #12`) into `RuleService` / `TransactionService` to dynamically convert foreign currency amounts before scoring against alert threshold rules.

---

## 📌 ADR-04: Model Primitive Wrapper Refactoring (`boolean` to `Boolean`)
* **Date:** Developer Technical Sync (`PR #8`)
* **Status:** **Accepted & Implemented**
* **Context:** Primitive `boolean` fields in Jackson/Spring JDBC entities forced uninitialized database fields to default to `false` instead of preserving `null`.
* **Decision:** Refactor domain entity fields (e.g. `isActive`) from primitive `boolean` to object wrapper `Boolean` to support nullable database states cleanly.

---

## 📌 ADR-05: Auto-Acknowledgment on Alert Inspection
* **Date:** UI/UX Review (`commit 73b5ac5`)
* **Status:** **Accepted & Implemented**
* **Context:** Requiring analysts to explicitly click an "Acknowledge" button for every alert created unnecessary friction during high-volume fraud reviews.
* **Decision:** Automatically trigger an alert status update from `OPEN` to `ACKNOWLEDGED` as soon as the analyst opens the alert modal details.

---

## 📌 ADR-06: Tri-Theme Engine Architecture (Light, Dark, Pink)
* **Date:** Frontend UI Refinement (`commit faf8d1d`)
* **Status:** **Accepted & Implemented**
* **Context:** Users requested visual customization and dark mode support for low-light environments.
* **Decision:** Implement a CSS variable-driven theme engine supporting 3 distinct themes: **Light Mode**, **Dark Mode**, and **Pink Mode**, with choice persistence in `localStorage`.

---

## 📌 ADR-07: Containerization & Dual-Port Orchestration
* **Date:** DevOps Integration (`PR #26`)
* **Status:** **Accepted & Implemented**
* **Context:** Running frontend and backend on host environments caused port conflicts and environment divergence across developer machines.
* **Decision:** 
  * Package Spring Boot backend into Docker container exposed on port `8082`.
  * Package Frontend static assets into Nginx container exposed on port `8083`.
  * Orchestrate both containers alongside SQL Server using `docker-compose.yml`.

---

## 📌 ADR-08: Centralized Global Exception Handling
* **Date:** Backend Resilience Hardening (`PR #24`)
* **Status:** **Accepted & Implemented**
* **Context:** Unhandled runtime exceptions resulted in raw Java stacktraces returned to the client application.
* **Decision:** Implement `@ControllerAdvice` in `GlobalExceptionHandler.java` to catch custom exceptions (e.g., `ResourceNotFoundException`, `InvalidRuleException`) and format standardized JSON error objects.
