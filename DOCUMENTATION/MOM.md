# Minutes of Meetings (MOM)

This document contains official records of sync meetings held between the client/product stakeholders and the development team.

---

## 📌 Meeting 1: Fraud Transaction & Alert System Requirements

* **Date:** Sprint 1 Discovery Sync
* **Attendees:** Product Stakeholders, Development Team
* **Objective:** Define domain models, alert metrics, and fraud transaction analysis workflows.

### 📝 Key Discussion Points & Agreed Requirements

1. **Transaction Data Structure:**
   * Each transaction must record: `Transaction ID`, `Payer (Institution)`, `Payee (Institution)`, `Currency`, `Amount`, and `Status`.

2. **Alert Analysis & Classification:**
   * Enable individual transaction analysis to classify alert types.
   * Calculate alert metrics using an exponential scoring function against predefined thresholds to compute a `total_score`.

3. **Alert Lifecycle & Acknowledgment:**
   * Provide an explicit text box for user acknowledgment on alerts.
   * Include a `Reference No.` linking back to the originating transaction.
   * **Open Alert View:** When an alert is opened, display full contextual info and allow seamless navigation to the associated transaction.
   * System state transitions:
```
  OPEN ➔ ACKNOWLEDGED ➔ INVESTIGATING ➔ CLOSED
               │                 │
               ▼                 ▼
           DISMISSED         DISMISSED
```

---

## 📌 Meeting 2: User Stories & Documentation Architecture

* **Date:** Sprint 2 Review & Documentation Alignment Sync
* **Attendees:** Product Stakeholders, Lead Architect, Development Team
* **Objective:** Finalize user story extensions, multi-currency rule handling, and project tracking documentation structure.

### 📝 Key Discussion Points & Agreed Requirements

1. **Transaction Lifecycle ("Transaction Move"):**
   * Capability to transition and move transaction states cleanly across system workflows.

2. **Multi-Currency Rule Evaluation:**
   * Support distinct rule evaluations across different currencies (requires integration with a real-time Currency Rate API).

3. **Automatic Acknowledgment:**
   * Implement automated acknowledgment logic for low-risk or system-recognized alerts.

4. **UI & Accessibility Extensions [Backlog]:**
   * Introduce a Points System and native support for Light & Dark UI modes.

5. **CI/CD Pipeline Observability:**
   * Track metrics on CI/CD pipeline execution count and build success rates.

6. **Zero-Configuration Repository Script:**
   * Provide automated setup scripts so developers and testers can run the project without manual environment configuration.

7. **Modular Documentation Architecture:**
   * Replace single monolithic `README.md` with a structured, multi-file documentation suite:
     * **Kanban Board (`KANBAN.md`)**
     * **Minutes of Meeting (`MOM.md`)**
     * **Internal Decision Log (`DECISION_LOG.md`)**
     * **Traceability Matrix (`TRACEABILITY_MATRIX.md`)**
     * **CI/CD Metrics (`METRICS.md`)**
