# Project Kanban Task Board

This board tracks all work items, feature tickets, and technical tasks across the **TxnSync** project lifecycle.

> 🔗 **Live Board Link:** [**GitHub Projects Kanban Board**](https://github.com/orgs/Neueda-Learning/projects/36/views/2)

---

## 📊 Sprint & Development Progress

```
  Completed (Done):  22 / 22 Core Tasks (100%) [████████████████████]
  Development Branch: develop (Latest commit: 9fd3d0f)
  CI/CD Status:       Passing (Docker & Jenkins Ready)
```

---

## 🟣 Completed (Done) — 22 Core Tasks

| Task ID | Title / Summary | Category | Linked PR / Branch | Commit / Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | FEAT: Add initial database schema and test data | Backend DB | PR #1 (`feature/db-schema`) | `9ba8f79`, `01-schema.sql` |
| **#2** | CHORE: Initialize Spring Boot project | Backend Core | PR #2 (`chore/backend-init`) | `9fa0a6f` |
| **#3** | docs: Add backend setup instructions in README | Documentation | PR #3 (`docs/update-readme`) | `66ab055` |
| **#4** | FEAT: Add Transaction, Rule, Account and Alert domain models | Backend Domain | PR #4 (`feature/domain-models`) | `af73737` |
| **#5** | Feature/repositories: Repository interfaces and JDBC implementations | Backend Data | PR #5 (`feature/repositories`) | `1144d14` |
| **#6** | Added Controller & Service layers | Backend API | PR #6 (`feature/controllers`) | `0d50a43` |
| **#7** | Fixed New Transaction ID bug | Bug Fix | PR #7 (`fix/transaction`) | `fc55a34` |
| **#8** | Change "boolean" to "Boolean" for isActive field | Model Refactor | PR #8 (`fix/rules`) | `5a66f0b` |
| **#9** | Remove POST endpoint for creating new Alert | API Cleanup | PR #9 (`fix/alerts`) | `a2f822d` |
| **#10** | Update `updateAlertStatus` for Alert Cycle workflow | Business Logic | PR #10 (`fix/alert_status`) | `028d61b` |
| **#11** | Added env variables implementation and fixed Health route | DevOps / API | PR #11 (`fix/envHealth`) | `40a20e4` |
| **#12** | Add currency rate API for Rule evaluation | Multi-Currency | PR #12 (`fix/currency-rules`) | `23f1331` |
| **#13** | Fix/new payee detection logic | Rule Logic | PR #13 (`fix/newPayee`) | `725de2d` |
| **#14** | Responsive Frontend UI & Page Layouts | Frontend | PR #28 (`feature/frontend-ui`) | `c69510c`, `9fd3d0f` |
| **#15** | Add Option for new Alert Type & Charts | Backend / UI | PR #28 (`feature/frontend-ui`) | `8e559f9` |
| **#16** | Unit & Service Test Cases Suite | QA / Testing | PR #23 (`tests/generate`) | `c9feaf3` to `14d13d4` |
| **#17** | Dashboard Charts (Lifecycle, Rule-Type, Volume) | Frontend UI | PR #28 (`feature/frontend-ui`) | `8e559f9`, `dashboard.js` |
| **#18** | Alert Stats & Auto-Acknowledgment on Open | Business Logic | PR #28 (`feature/frontend-ui`) | `73b5ac5` |
| **#19** | Accessibility Features (Font scale, contrast, ARIA) | Accessibility | PR #28 (`feature/frontend-ui`) | `ec93a11`, `9e570f4` |
| **#20** | Service & Controller DTO Refactoring | Backend Refactor | `develop` | `TransactionService.java` |
| **#21** | Global Exception Handling (`@ControllerAdvice`) | Backend Resilience | PR #24 (`fix/expection-handling`) | `272b715` |
| **#22** | Containerization & Jenkins CI/CD Automation | DevOps | PR #26 (`CI/CD`) | `Jenkinsfile`, `docker-compose.yml` |
