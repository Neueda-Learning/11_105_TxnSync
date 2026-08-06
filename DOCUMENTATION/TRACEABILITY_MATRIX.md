# Requirement Traceability Matrix (RTM)

The **Requirement Traceability Matrix** links client meeting requirements directly to Agile User Stories, developer task tickets, feature branches, pull requests, and Git commit hashes for 100% auditability.

---

## 🔗 Comprehensive Traceability Matrix

| Req ID | Customer Source | User Story | Feature Description | Kanban Task ID | Branch | Pull Request | Key Commit Hashes | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Meeting 1 | `US-001` | Transaction schema definition (ID, Payer, Payee, Currency, Amount, Status) | `#1`, `#4` | `feature/db-schema`, `feature/domain-models` | PR #1, PR #4 | `9ba8f79`, `af73737` | **Completed** |
| **REQ-02** | Meeting 1 & 2 | `US-001` | Core persistence and repository interfaces | `#5` | `feature/repositories` | PR #5 | `1144d14`, `418d90e` | **Completed** |
| **REQ-03** | Meeting 1 | `US-001` | Controller REST API and Service business layer | `#6` | `feature/controllers` | PR #6 | `0d50a43`, `f339623` | **Completed** |
| **REQ-04** | Meeting 1 | `US-001` | Fix Transaction ID generation bug | `#7` | `fix/transaction` | PR #7 | `fc55a34`, `09051b2` | **Completed** |
| **REQ-05** | Meeting 1 & 2 | `US-004` | Alert cycle workflow (`OPEN` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `CLOSED`, with `DISMISSED` options) | `#9`, `#10` | `fix/alerts`, `fix/alert_status` | PR #9, PR #10 | `a2f822d`, `028d61b`, `84aafe1` | **Completed** |
| **REQ-06** | Meeting 2 | `US-009` | Environment variable configuration & Health route | `#11` | `fix/envHealth` | PR #11 | `40a20e4`, `d5bb41c` | **Completed** |
| **REQ-07** | Meeting 2 (Item 2) | `US-002` | Multi-Currency Rule Evaluation via Currency Rate API | `#12` | `fix/currency-rules` | PR #12 | `23f1331`, `cf34b3b` | **Completed** |
| **REQ-08** | Meeting 1 | `US-001` | New Payee fraud detection rule logic | `#13` | `fix/newPayee` | PR #13 | `725de2d`, `9112b5e` | **Completed** |
| **REQ-09** | Meeting 1 & 2 | `US-005`, `US-007` | Responsive Frontend UI, Dashboards & Charts | `#14`, `#17` | `feature/frontend-ui` | PR #28 | `c69510c`, `8e559f9`, `9fd3d0f` | **Completed** |
| **REQ-10** | Meeting 2 (Item 3) | `US-003` | Auto-acknowledge alerts on open | `#18` | `feature/frontend-ui` | PR #28 | `73b5ac5` | **Completed** |
| **REQ-11** | Meeting 2 (Item 4) | `US-005` | Tri-Theme Support (Light, Dark, Pink) | `#14` | `feature/frontend-ui` | PR #28 | `66e6c99`, `faf8d1d` | **Completed** |
| **REQ-12** | Meeting 2 (Item 4) | `US-006` | Accessibility control panel (scaling, contrast) | `#19` | `feature/frontend-ui` | PR #28 | `ec93a11`, `9e570f4` | **Completed** |
| **REQ-13** | Meeting 2 (Item 5) | `US-010` | Jenkins CI/CD Pipeline & Docker orchestration | `#22` | `CI/CD` | PR #26 | `e7a7027`, `7c9c8a1`, `c89d8c0` | **Completed** |
| **REQ-14** | Meeting 2 (Item 6) | `US-012` | Zero-configuration Docker Compose setup | `#22` | `CI/CD` | PR #26 | `7c9c8a1`, `1527f79` | **Completed** |
| **REQ-15** | Sprint 2 Refinement | `US-008` | Global Exception Handling (`@ControllerAdvice`) | `#21` | `fix/expection-handling` | PR #24 | `272b715`, `452dce2` | **Completed** |
| **REQ-16** | Sprint 2 QA | `US-011` | Automated Unit Test Suite (8 test classes) | `#16` | `tests/generate` | PR #23 | `14d13d4` to `c9feaf3` | **Completed** |
| **REQ-17** | Meeting 2 (Item 7) | `US-012` | Modular multi-file documentation architecture | `#3` | `docs/update-readme` | PR #3 | `66ab055`, `d3c6689` | **Completed** |
