# KAVACH — System Architecture & Technical Specification

**Document Version:** 3.0.0  
**Classification:** Enterprise Cyber Defense System Architecture  
**Author:** Principal Software Architect & DevSecOps Lead

---

## 1. High-Level Architecture Overview

```
+---------------------------------------------------------------------------------------------------------+
|                                        WINDOWS ENDPOINT AGENT                                           |
|                                                                                                         |
|  +--------------------+   +---------------------+   +--------------------+   +-----------------------+  |
|  | Windows Sensors(16)|   | Edge Classifier     |   | Resilient Spooler  |   | HTTPS Shipper Client  |  |
|  | Process, Net, USB, |-->| 5-Tier Priority     |-->| Encrypted SQLite   |-->| Authenticated REST /  |  |
|  | Sysmon, EventLog...|   | (Critical -> Stat)  |   | Ring Buffer (200MB)|   | Mutual TLS / WS       |  |
|  +--------------------+   +---------------------+   +--------------------+   +-----------------------+  |
|                                                                                          |              |
|  +---------------------------------------------+   +-------------------------------------+--------+     |
|  | User-Session Desktop UI                     |   | Local Cryptographic Identity Store           |     |
|  | - Flutter Desktop Companion (`mobile/`)     |   | - Windows DPAPI Hardware Protection          |     |
|  | - Python Companion GUI (`companion.py`)    |   | - RSA-2048 Local Keypair Storage             |     |
|  | - One-Click Shield Emergency Containment    |   | - Single-Use Nonce Signature Verification    |     |
|  +---------------------------------------------+   +----------------------------------------------+     |
|                                                                                                         |
|  +------------------------------------------------------------------------------------------------+     |
|  | Windows Background Service (`KavachAgentService` in Session 0 via Service Control Manager)     |     |
|  +------------------------------------------------------------------------------------------------+     |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                   TLS 1.3 / REST API (`/api/v1`)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                     KAVACH CLOUD ANALYSIS SERVER                                        |
|                                                                                                         |
|  +--------------------+   +--------------------+   +--------------------+   +------------------------+  |
|  | Ingestion Gateway  |-->| Pluggable Priority |-->| Central Pipeline   |-->| Detection Engines      |  |
|  | Device Token Auth  |   | Broker (5 Tiers:   |   | Deduplication &    |   | - 120+ Deterministic   |  |
|  | Nonce Verification |   | Critical -> Stat)  |   | Schema Normalizer  |   |   MITRE Rules          |  |
|  +--------------------+   +--------------------+   +--------------------+   | - Isolation Forest ML  |  |
|                                                                             | - Dynamic Hybrid Score |  |
|                                                                             +------------------------+  |
|                                                                                          |              |
|  +--------------------+   +--------------------+   +--------------------+                v              |
|  | Dual-Gate Account  |   | Role-Based Access  |   | Notification Svc   |   +------------------------+  |
|  | Approval Engine    |   | Control (RBAC)     |   | - Local Dev Mock   |   | SOAR Playbook Engine   |  |
|  | Admin -> Analyst   |   | Admin / SOC / User |   | - AWS SNS & SES    |   | Automated Containment  |  |
|  +--------------------+   +--------------------+   +--------------------+   +------------------------+  |
|                                                                                          |              |
|  +--------------------+   +--------------------+   +--------------------+                |              |
|  | Raksha AI Assistant|   | Audit Trail Engine |   | URL Security SSRF  |                |              |
|  | Sanitized Context  |   | Append-Only Log    |   | Homograph & Rebind |                |              |
|  +--------------------+   +--------------------+   +--------------------+                |              |
+------------------------------------------------------------------------------------------+--------------+
           |                                         |                                     |
           v                                         v                                     v
+-----------------------+                 +--------------------+                +----------------------+
| Relational Storage    |                 | Unified UI Clients |                | Threat Intelligence  |
| - SQLite (WAL Mode)   |                 | - Web Dashboard    |                | - CERT-In Advisories |
| - PostgreSQL Ready    |                 | - Flutter Desktop  |                | - VirusTotal & OTX   |
| - ACID Migrations     |                 | - Flutter Android  |                | - AbuseIPDB Feeds    |
+-----------------------+                 +--------------------+                +----------------------+
```

---

## 2. Core Subsystem Architecture

### 2.1 Endpoint Agent Subsystem
- **16 High-Precision Sensors**:
  1. `ProcessCollector`: Windows process creation, process injection, parent PID spoofing, LOLBins.
  2. `NetworkCollector`: TCP/UDP sockets, active listeners, established outbound C2 beacons.
  3. `SysmonCollector`: Sysmon Event ID 1 (Process Create), Event ID 3 (Net Connect), Event ID 6 (Driver Load).
  4. `EventLogCollector`: Windows Security Event IDs 4624 (Logon), 4625 (Failed Logon), 4688 (Process Start).
  5. `PowerShellCollector`: Script Block Logging (Event ID 4104) and Base64 encoded payload interception.
  6. `FimCollector`: File Integrity Monitoring on critical system paths with SHA-256 baseline hashing.
  7. `UsbCollector`: Removable storage device plug/unplug events and drive authorization.
  8. `DnsCollector`: Endpoint DNS resolution tracking, algorithmic domain generation (DGA) heuristics.
  9. `RegistryCollector`: Windows Run keys, startup persistence, Winlogon modifications.
  10. `ServiceCollector`: Service Control Manager event tracking and service installation alerts.
  11. `ScheduledTaskCollector`: Task Scheduler creation and modification (`schtasks.exe`).
  12. `SoftwareInventoryCollector`: Installed software list, vulnerable version enumeration.
  13. `SystemHealthCollector`: Real-time CPU, RAM, disk utilization, and thermal states.
  14. `DefenderCollector`: Real-time Microsoft Defender engine status, signature update age.
  15. `CanaryCollector`: Active tripwire files placed in sensitive folders for early ransomware traps.
  16. `AuthCollector`: Interactive, network, and remote desktop logon session monitoring.

- **Offline Spooler & Shipper**:
  - SQLite WAL database (`data/agent_spool.db`).
  - Strict circular capacity quota (max 200 MB, FIFO eviction of P4/P5 lowest-priority telemetry under full disk pressure).
  - Bounded exponential backoff shipper with jitter (1s base, 60s max) preventing server thundering herd.

- **Session Isolation**:
  - Background collector service runs in Windows Session 0 as a service under `NT AUTHORITY\SYSTEM` or a dedicated low-privilege service account.
  - Interactive companion UI (Flutter Desktop / Tkinter GUI) runs in the active user's desktop session (Session 1+), communicating via local loopback IPC or status IPC files with strict ACLs.

### 2.2 Server Analysis & Ingestion Subsystem
- **Dual Priority Processing Queues**:
  - Priority Queue (Capacity 10,000, 4 concurrent workers): Serves P1/P2 Critical & High security alerts with guaranteed sub-100ms latency.
  - Background Queue (Capacity 30,000, 6 concurrent workers): Serves P3/P4/P5 operational telemetry, statistics, and health metrics.
- **Deduplication Engine**: MD5 sliding time-window hash table suppressing duplicate flood events from repeating loops.
- **Hybrid Risk Engine**:
  $$\text{Risk Score} = 0.40 \times \text{Rule Score} + 0.35 \times \text{ML Anomaly} + 0.25 \times \text{Threat Intel}$$
  - Rule Engine: 120+ deterministic MITRE ATT&CK heuristics.
  - ML Pipeline: Scikit-learn `IsolationForest` unsupervised model with 16 dynamic behavioral features.

### 2.3 Notification Subsystem Architecture
```
                     +----------------------------+
                     |    NotificationService     |
                     | - Preference Enforcement   |
                     | - Idempotency Deduplication|
                     | - Exponential Retry Queue  |
                     +----------------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
   +-----------------------------+   +-----------------------------+
   |   MockNotificationProvider  |   |    AWSNotificationProvider  |
   |   (Local Development & CI)  |   |   (Production Cloud Fleet)  |
   | - Zero AWS Credentials Req  |   | - AWS SNS (Security Alerts) |
   | - Redacted In-Memory Log    |   | - Amazon SES (Rich HTML)    |
   | - Instant Deterministic Test|   | - IAM Least-Privilege Role  |
   +-----------------------------+   +-----------------------------+
```

### 2.4 Account & Device Lifecycle State Machines

#### Account Lifecycle State Machine
```
[User Registration]
       │
       ▼
(PENDING_EMAIL_VERIFICATION) ───▶ [Valid Email Token]
                                          │
                                          ▼
                                     (REQUESTED)
                                          │
                                          ▼ [Admin Approval]
                                   (ADMIN_APPROVED)
                                          │
                                          ▼ [Auto Least-Loaded Assignment]
                                  (ANALYST_ASSIGNED)
                                          │
                                          ▼ [SOC Analyst Verification]
                                       (ACTIVE)
                                      /        \
                             [Suspension]    [Deactivation]
                                    v            v
                              (SUSPENDED)  (DEACTIVATED)
```

#### Device Lifecycle State Machine
```
[Agent Installed]
       │
       ▼
 (NOT_ENROLLED) ───▶ [Request Single-Use Nonce] ───▶ (ENROLLMENT_PENDING)
                                                            │
                                                            ▼ [RSA-2048 Signature Verified]
                                                        (ENROLLED)
                                                            │
                                                            ▼ [Device Authorized]
                                                         (ACTIVE)
                                                            │
                                                            ▼ [Revocation Request]
                                                         (REVOKED)
```
