# Agile User Stories

This document details the Agile User Stories defining functional expectations for risk analysts, compliance officers, developers, and system administrators.

---

## 📋 User Story Backlog

### US-001: Transaction Monitoring & Ingestion
> **As a** Risk Analyst,  
> **I want to** view and search financial transactions in real-time with normalized currency values,  
> **So that** I can detect suspicious activity across international accounts.

### US-002: Multi-Currency Rule Evaluation
> **As a** Compliance Officer,  
> **I want** rules to automatically convert foreign transaction amounts using live exchange rates,  
> **So that** fraud thresholds are accurately enforced regardless of transaction currency.

### US-003: Auto-Acknowledgment on Alert Open
> **As a** Risk Analyst,  
> **I want** alerts to automatically transition to `ACKNOWLEDGED` when I open their details,  
> **So that** I save repetitive manual clicks during high-volume investigations.

### US-004: Alert Lifecycle Management
> **As a** Fraud Operations Lead,  
> **I want** alerts to strictly follow a state workflow (`OPEN` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `CLOSED`, with `DISMISSED` options),  
> **So that** my team maintains a clear audit trail for every suspicious transaction.

### US-005: Tri-Theme UI Customization (Light, Dark, Pink)
> **As a** Dashboard User,  
> **I want to** switch between Light, Dark, and Pink visual themes,  
> **So that** I can comfortably work in low-light environments or personalize my display.

### US-006: Accessibility Control Panel
> **As a** User with visual impairments or specific accessibility needs,  
> **I want to** adjust font scaling and toggle high-contrast mode,  
> **So that** I can comfortably navigate the application interface without eye strain.

### US-007: Visual Analytics & Dashboard Charts
> **As an** Executive Stakeholder,  
> **I want to** view charts showing alert status distributions, rule-type triggers, and volume trends,  
> **So that** I can evaluate operational risk metrics at a single glance.

### US-008: Global Exception Handling
> **As a** Frontend Developer,  
> **I want** the backend API to return standard, structured error JSON messages when requests fail,  
> **So that** the UI can present user-friendly error banners without crashing.

### US-009: Containerized Local Deployment
> **As a** Software Developer,  
> **I want to** launch the full application stack (backend, frontend, database) using `docker-compose up`,  
> **So that** I can run the complete project locally with zero manual environment configuration.

### US-010: Automated CI/CD Pipeline
> **As a** DevOps Engineer,  
> **I want** Jenkins to automatically run unit tests and build Docker containers on code pushes,  
> **So that** software releases are reliable and continuously validated.
