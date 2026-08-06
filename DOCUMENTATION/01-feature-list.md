# Agile Product Feature List

This document outlines the complete functional feature list and epic breakdown for the **TxnSync** Fraud Transaction & Alert Sync System.

---

## 🚀 Epic Breakdown

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            TxnSync Platform                             │
 └────────────────────┬───────────────────────────────┬────────────────────┘
                      │                               │
        ┌─────────────┴─────────────┐   ┌─────────────┴─────────────┐
        │  Core Business Logic      │   │  UX & Infrastructure      │
        ├───────────────────────────┤   ├───────────────────────────┤
        │ • Transaction Engine      │   │ • Tri-Theme & Accessiblty │
        │ • Multi-Currency Rules    │   │ • Real-time Charts        │
        │ • Alert Auto-Ack Workflow │   │ • Docker & Jenkins CI/CD  │
        └───────────────────────────┘   └───────────────────────────┘
```

---

## 📌 Feature Catalog

### EPIC 1: Fraud Transaction Processing (`FEAT-01`)
* **FEAT-01.1 Transaction Ingestion:** Record financial transactions with attributes (`id`, `payer`, `payee`, `amount`, `currency`, `timestamp`, `status`).
* **FEAT-01.2 Transaction Movement:** State transition management for transactions across system lifecycle stages.
* **FEAT-01.3 Payee Risk Evaluation:** Automated identification of new or suspicious payees linked to payer accounts.

### EPIC 2: Dynamic Multi-Currency Rule Engine (`FEAT-02`)
* **FEAT-02.1 Rule Management CRUD:** Create, read, update, and toggle active status for fraud detection rules.
* **FEAT-02.2 Real-time Exchange Rate API:** Automatic normalization of foreign currency amounts to base currency before threshold rule scoring.
* **FEAT-02.3 Rule Types:** Support for Threshold Amount Rules, Volume-vs-Alerts Rules, and New Payee Detection Rules.

### EPIC 3: Alert Lifecycle & Auto-Acknowledgment (`FEAT-03`)
* **FEAT-03.1 Alert Trigger Engine:** Automatic creation of alert records upon rule violation.
* **FEAT-03.2 Auto-Acknowledgment on Inspection:** Automatically transition alert state from `OPEN` to `ACKNOWLEDGED` when viewed by an analyst.
* **FEAT-03.3 Alert State Machine:** Enforced state progression:
```
  OPEN ➔ ACKNOWLEDGED ➔ INVESTIGATING ➔ CLOSED
               │                 │
               ▼                 ▼
           DISMISSED         DISMISSED
```
* **FEAT-03.4 Transaction Context Pass-through:** Direct navigation from alert modal back to full transaction details.

### EPIC 4: Dashboard Analytics & Tri-Theme UX (`FEAT-04`)
* **EPIC 4.1 Interactive Charts:** Visualizations for Alert Lifecycle distribution, Rule-Type breakdown, and Volume-vs-Alerts timeline using Chart.js.
* **EPIC 4.2 Tri-Theme Support:** One-click switching between **Light Mode**, **Dark Mode**, and **Pink Mode**.
* **EPIC 4.3 Accessibility Controls:** Dedicated accessibility panel supporting font scaling, high-contrast mode, and ARIA attributes.

### EPIC 5: Enterprise Resiliency & Test Suite (`FEAT-05`)
* **FEAT-05.1 Global Exception Handling:** Uniform HTTP error responses via Spring `@ControllerAdvice`.
* **FEAT-05.2 Backend DTO Refactoring:** Strict separation between database persistence models and API request/response payloads.
* **FEAT-05.3 Automated Unit & Integration Tests:** 8 comprehensive test classes validating Service logic and Controller endpoints.

### EPIC 6: DevOps, Containerization & CI/CD (`FEAT-06`)
* **FEAT-06.1 Docker Containerization:** Multi-stage `Dockerfile` configurations for Spring Boot backend and Nginx/Static frontend.
* **FEAT-06.2 Docker Compose Stack:** Single-command local environment orchestration with SQL Server dependency health checks.
* **FEAT-06.3 Jenkins CI/CD Pipeline:** Automated build, test, and container packaging via repository `Jenkinsfile`.
