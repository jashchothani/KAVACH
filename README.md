<div align="center">

# 🛡️ KAVACH

### `AI-DRIVEN SOAR • XDR • THREAT INTELLIGENCE • RESPONSE`

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=25&duration=2800&pause=900&color=00F5FF&center=true&vCenter=true&width=850&lines=AI-Driven+Cybersecurity+Platform;Extended+Detection+%26+Response;Security+Orchestration+%26+Response;Behavioral+Machine+Learning;Threat+Intelligence+%2B+MITRE+ATT%26CK;Raksha+AI+Cybersecurity+Copilot;One+Shield.+One+Security+Fabric." alt="KAVACH animated tagline"/>

<br>

<img src="https://img.shields.io/badge/🛡️%20KAVACH-SECURITY%20PLATFORM-05070D?style=for-the-badge&labelColor=05070D&color=00E5FF"/>
<img src="https://img.shields.io/badge/XDR-ENABLED-05070D?style=for-the-badge&labelColor=05070D&color=00FF9C"/>
<img src="https://img.shields.io/badge/SOAR-AUTOMATED-05070D?style=for-the-badge&labelColor=05070D&color=FF3B6B"/>
<img src="https://img.shields.io/badge/AI-RAKSHA-05070D?style=for-the-badge&labelColor=05070D&color=8B5CF6"/>

<br><br>

<a href="#-kavach">
<img src="https://img.shields.io/badge/EXPLORE%20KAVACH-00E5FF?style=for-the-badge&logo=shield&logoColor=black"/>
</a>
<a href="#-architecture">
<img src="https://img.shields.io/badge/ARCHITECTURE-8B5CF6?style=for-the-badge&logo=blueprint&logoColor=white"/>
</a>
<a href="#-quick-start">
<img src="https://img.shields.io/badge/QUICK%20START-00FF9C?style=for-the-badge&logo=rocket&logoColor=black"/>
</a>

<br><br>

<img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=0:05070D,50:061B2B,100:001F29&section=header&text=ONE%20SHIELD.%20ONE%20SECURITY%20FABRIC.&fontSize=24&fontColor=00E5FF&animation=twinkling&fontAlignY=65" width="100%"/>

</div>

---

<div align="center">

## ⚡ KAVACH SECURITY CORE

```text
                         ╔══════════════════════════════╗
                         ║        🛡️  K A V A C H       ║
                         ║     SECURITY INTELLIGENCE    ║
                         ╚══════════════════════════════╝
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
       │   DETECT     │       │  UNDERSTAND  │       │   RESPOND    │
       │              │       │              │       │              │
       │  Rules + ML  │──────▶│  Raksha AI   │──────▶│    SOAR      │
       │  MITRE + TI  │       │  Correlation │       │  Automation  │
       └──────────────┘       └──────────────┘       └──────────────┘
              ▲                       ▲                       │
              │                       │                       ▼
       ┌──────┴───────┐       ┌───────┴──────┐        ┌──────────────┐
       │   TELEMETRY  │       │   INCIDENT   │        │    AUDIT     │
       │   16 ENGINES │       │    ENGINE    │        │   + ROLLBACK │
       └──────────────┘       └───────────────┘        └──────────────┘
```

### `SENSE → DETECT → CORRELATE → EXPLAIN → RESPOND → PROTECT`

</div>

---

# 🛡️ KAVACH

**KAVACH** — कवच (*shield / armor*) — is a unified **AI-driven SOAR-XDR cybersecurity platform** designed to continuously observe endpoint behavior, detect suspicious activity, correlate evidence, enrich threats with intelligence, explain incidents, and execute controlled response actions.

It combines:

> **XDR + SOAR + Behavioral ML + MITRE ATT&CK + Threat Intelligence + URL Security + Raksha AI**

into one security operations ecosystem.

---

# 🌌 THE KAVACH VISION

<div align="center">

```text
                         THE DIGITAL ENVIRONMENT
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       KAVACH            │
                    │   CONTINUOUS DEFENSE    │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   🖥️ ENDPOINTS             🌐 NETWORK               🌍 WEB
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 ▼
                       ┌─────────────────┐
                       │  INTELLIGENCE   │
                       ├─────────────────┤
                       │ MITRE ATT&CK    │
                       │ IsolationForest │
                       │ Threat Intel    │
                       │ Correlation     │
                       └────────┬────────┘
                                ▼
                         ┌──────────────┐
                         │  RAKSHA AI   │
                         │              │
                         │  Understand  │
                         │  Explain     │
                         │  Recommend   │
                         └──────┬───────┘
                                ▼
                         ┌──────────────┐
                         │    SOAR      │
                         │   RESPONSE   │
                         └──────┬───────┘
                                ▼
                           🛡️ PROTECTED
```

---

# 🏛️ ENTERPRISE PLATFORM CORE ARCHITECTURE (v2.1.0)

KAVACH has been engineered into a production-grade, multi-tenant cyber defense fabric:

| Core Subsystem | Technology & Implementation | Documentation |
|---|---|---|
| **Dual-Gate Zero-Trust Account Lifecycle** | Multi-gate state machine (`REQUESTED` ➔ `ADMIN_APPROVED` ➔ `ANALYST_ASSIGNED` ➔ `ACTIVE`), least-loaded SOC analyst auto-assignment with randomized tie-breakers, zero self-activation, instant session revocation on suspension. | [Account Workflow Guide](docs/ACCOUNT_WORKFLOW.md) |
| **Cryptographic Device Identity & DPAPI** | 2048-bit RSA keypair generated locally, private key protected by Windows DPAPI (`CryptProtectData`), 5-min single-use signed challenge nonces, `kavach_dev_...` tokens with SHA-256 server hashing. | [Device Enrollment Guide](docs/DEVICE_ENROLLMENT.md) |
| **16 Real-Time Telemetry Sensors** | Sysmon, Windows EventLog, Process, PowerShell (Script Block 4104), Network, FIM, USB, Defender, Registry, DNS, Canary, Service, Scheduled Task, Software, and System Info. | [Telemetry Data Flow Guide](docs/TELEMETRY_DATA_FLOW.md) |
| **Windows Companion & System Tray** | Native Windows System Tray Guardian (`tray_companion.py`), One-Click Shield host containment, live sensor health meters, and dark crimson desktop GUI (`companion.py`). | [Installer & Packaging Guide](docs/INSTALLER.md) |
| **Non-Destructive Database Migrations** | Safe migration runner verified on 94.5MB SQLite production database (`kavach.db.bak`), supporting SQLite and PostgreSQL schema evolution with zero data loss. | [Database Migrations Guide](docs/DATABASE_MIGRATIONS.md) |
| **Enterprise Cloud & AWS Deployment** | AWS ECS Fargate task definition, multi-stage hardened Dockerfiles (`Dockerfile.prod`), AWS Secrets Manager integration, CloudWatch structured logs, and Docker Compose stack. | [AWS Deployment Guide](docs/DEPLOYMENT.md) |
| **Zero-Mocked Automated Test Suite** | 54 automated pytest tests covering RBAC, DPAPI roundtrips, replay attack prevention, offline spool priority, and SOAR containment with 100% pass rate. | [Testing & QA Guide](docs/TESTING.md) |

---

# 📚 DOCUMENTATION DIRECTORY

- 🛡️ [System Architecture](docs/ARCHITECTURE.md)
- 🔐 [Zero-Trust Account Governance](docs/ACCOUNT_WORKFLOW.md)
- 🔑 [Cryptographic Device Enrollment](docs/DEVICE_ENROLLMENT.md)
- 📡 [Telemetry Sensors & Pipeline Flow](docs/TELEMETRY_DATA_FLOW.md)
- 💾 [Safe Database Migrations](docs/DATABASE_MIGRATIONS.md)
- ☁️ [AWS Cloud & ECS Deployment](docs/DEPLOYMENT.md)
- 📦 [Windows Inno Setup Installer](docs/INSTALLER.md)
- 💻 [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)
- 🧪 [Automated Test Suite](docs/TESTING.md)
- 🔒 [Security Review & Audits](docs/SECURITY_REVIEW.md)
- 📋 [Implementation Master Plan](docs/IMPLEMENTATION_PLAN.md)
- 🔍 [Repository Audit Report](docs/REPOSITORY_AUDIT.md)

---

# 🔥 PLATFORM CAPABILITIES

<table>
<tr>
<td width="50%">

### 🖥️ XDR

Continuous endpoint visibility across:

* Processes
* Network connections
* Files
* Registry
* Services
* PowerShell
* Sysmon
* Windows Event Logs
* DNS
* USB devices

</td>

<td width="50%">

### ⚡ SOAR

Controlled automated response:

* Device isolation
* Domain blocking
* Process termination
* Evidence collection
* Ransomware containment
* Credential-dumping containment
* Brute-force defense

</td>
</tr>

<tr>
<td>

### 🧠 BEHAVIORAL ML

Real `IsolationForest` anomaly detection.

No fabricated predictions.

No artificial confidence.

Insufficient data → `insufficient_data`

</td>

<td>

### 🤖 RAKSHA AI

AI cybersecurity copilot with:

* NVIDIA NIM
* Local fallback
* Context sanitization
* Incident explanation
* Defensive recommendations

</td>
</tr>

<tr>
<td>

### 🎯 MITRE ATT&CK

Behavior mapped to:

* Tactics
* Techniques
* Detection coverage
* Incident context
* SOC heatmaps

</td>

<td>

### 🌐 URL SHIELD

Protection against:

* Phishing
* Homographs
* Punycode
* Typosquatting
* SSRF
* Metadata endpoint access

</td>
</tr>

<tr>
<td width="50%">

### ⚔️ ATTACK GRAPH

Visual threat topology:

* Multi-stage attack path mapping
* Real-time blast radius calculation
* Atomic 1-click containment
* APT29, Akira, FIN7 scenarios
* Animated SVG threat particles

</td>

<td width="50%">

### 🏛️ CERT-In COMPLIANCE

Indian regulatory adherence:

* 6-hour statutory reporting timer
* Automated Annexure-I generation
* 180-day immutable log vault
* Merkle hash integrity proofs
* National threat advisories

</td>
</tr>

<tr>
<td>

### 🕸️ MAYAJAAL DECEPTION

Zero false-positive detection:

* Honey files & credentials
* Ghost socket listeners
* Registry canary traps
* Sub-22ms process kill
* Canary bait deployment

</td>

<td>

### ⚡ RAKSHA FLOW STUDIO

Visual SOAR playbook builder:

* Drag-and-drop node canvas
* AI prompt-to-playbook synthesis
* Dry-run simulation with animation
* JSON playbook export
* Real-time execution profiling

</td>
</tr>
</table>

---

# 🧬 KAVACH INTELLIGENCE FABRIC

```mermaid
flowchart LR

    A["🖥️ Windows Endpoint"] --> B["📡 Telemetry"]
    B --> C["⚙️ Async Event Bus"]
    C --> D["🧹 Normalize"]
    D --> E["♻️ Deduplicate"]

    E --> F["🎯 MITRE Rules"]
    E --> G["🧠 Isolation Forest"]
    E --> H["🌐 Threat Intelligence"]

    F --> I["⚖️ Hybrid Risk Engine"]
    G --> I
    H --> I

    I --> J["🔗 Incident Correlation"]

    J --> K["🚨 Alert"]
    J --> L["⚡ SOAR"]
    J --> M["🤖 Raksha AI"]

    L --> N["🛡️ Response"]
    M --> O["💬 Explanation"]

    N --> P["📜 Audit"]
    O --> P
```

---

# 🛰️ 16-ENGINE ENDPOINT TELEMETRY

<div align="center">

|      | Engine                | Detection Domain                            |
| :--: | --------------------- | ------------------------------------------- |
| `01` | 🧠 Process Collector  | LOLBins, PowerShell, parent-child anomalies |
| `02` | 🌐 Network Collector  | C2, scanning, unusual connections           |
| `03` | 📁 File Integrity     | Ransomware-like activity                    |
| `04` | 🔐 Login / Auth       | Brute force, RDP anomalies                  |
| `05` | 💻 PowerShell         | Obfuscation, suspicious scripts             |
| `06` | 🔬 Sysmon             | High-fidelity Windows telemetry             |
| `07` | 📜 Windows EventLog   | Services, audit manipulation                |
| `08` | 🌍 DNS                | DGA-like behavior, tunneling                |
| `09` | 🗂️ Registry          | Persistence                                 |
| `10` | 🔌 USB                | Rogue device activity                       |
| `11` | 🛡️ Windows Defender  | Threat/quarantine telemetry                 |
| `12` | ⏰ Scheduled Tasks     | Persistence                                 |
| `13` | 📦 Software Inventory | Vulnerable software                         |
| `14` | 📊 System Telemetry   | Host baseline                               |
| `15` | 🐤 Canary             | Early ransomware warning                    |
| `16` | ⚙️ Service Collector  | Service persistence                         |

</div>

---

# 🧠 BEHAVIORAL ML ENGINE

### Genuine machine learning. Zero fake predictions.

```python
from sklearn.ensemble import IsolationForest
```

KAVACH extracts behavioral characteristics from endpoint telemetry.

```text
┌─────────────────────────────────────────────┐
│           BEHAVIORAL FEATURE VECTOR         │
├─────────────────────────────────────────────┤
│ Process rarity                              │
│ Destination-port diversity                  │
│ Network burst ratio                         │
│ Parent-child deviation                      │
│ Command-line entropy                        │
│ Process frequency                            │
│ Connection irregularity                      │
│ Host activity deviation                      │
│ File modification behavior                   │
│ Execution-pattern deviation                  │
└─────────────────────────────────────────────┘
```

### Strict model readiness

```text
                 MODEL STATE
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
      SUFFICIENT            INSUFFICIENT
        DATA                    DATA
          │                     │
          ▼                     ▼
   Isolation Forest        No prediction
          │                     │
          ▼                     ▼
    Anomaly Signal        insufficient_data
```

KAVACH never turns missing training data into an invented security score.

---

# 🎯 MITRE ATT&CK DETECTION FABRIC

```mermaid
mindmap
  root((KAVACH))
    Initial Access
      Phishing
      Valid Accounts
      Public-Facing Applications
    Execution
      PowerShell
      Command Shell
      Scripting
    Persistence
      Registry Run Keys
      Scheduled Tasks
      Services
    Defense Evasion
      Obfuscation
      Indicator Removal
      Event Log Manipulation
    Credential Access
      Credential Dumping
      LSASS Activity
    Discovery
      Network Discovery
      System Discovery
    Lateral Movement
      SMB
      RDP
      Remote Services
    Command and Control
      DNS
      Beaconing
      Unusual Outbound Traffic
```

---

# 🌐 KAVACH URL SHIELD

```text
                    URL REQUEST
                         │
                         ▼
               ┌───────────────────┐
               │ URL NORMALIZATION │
               └─────────┬─────────┘
                         ▼
               ┌───────────────────┐
               │ LEXICAL ANALYSIS  │
               └─────────┬─────────┘
                         ▼
              ┌──────────────────────┐
              │ IDN / HOMOGRAPH CHECK│
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │ TYPOSQUAT ANALYSIS   │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │ SSRF POLICY ENGINE   │
              └──────────┬───────────┘
                         ▼
                 ┌───────┴───────┐
                 ▼               ▼
               SAFE            BLOCK
                 │               │
                 ▼               ▼
                OK          SECURITY ALERT
```

### SSRF protection

```text
127.0.0.0/8
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
169.254.169.254
::1
```

are treated as restricted destinations where applicable to the URL security policy.

---

# 🧩 BROWSER SHIELD

<div align="center">

```text
       🌐 BROWSER
           │
           ▼
   ┌──────────────────┐
   │ KAVACH EXTENSION │
   │    MV3 SHIELD    │
   └────────┬─────────┘
            │
       ┌────┴────┐
       ▼         ▼
    ANALYZE    ANALYZE
       │         │
       └────┬────┘
            ▼
      ┌───────────┐
      │   RISK    │
      │  ENGINE   │
      └─────┬─────┘
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
    🟢     🟡     🔴
    OK    WARN    RISK
```

</div>

The Chromium Manifest V3 extension provides lightweight real-time browser protection with minimal permissions.

---

# 🤖 RAKSHA AI

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=20&duration=2400&pause=700&color=8B5CF6&center=true&vCenter=true&width=750&lines=RAKSHA+AI+%7C+CYBERSECURITY+COPILOT;Investigate.;Explain.;Recommend.;Never+replace+the+source+of+truth." alt="Raksha AI animation"/>

</div>

Raksha AI is KAVACH's embedded cybersecurity assistant.

### Intelligence hierarchy

```text
                 SECURITY EVIDENCE
                        │
                        ▼
             ┌────────────────────┐
             │ KAVACH CORE ENGINE  │
             └─────────┬──────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       MITRE           ML           TI
          │            │            │
          └────────────┼────────────┘
                       ▼
               INCIDENT CONTEXT
                       │
                       ▼
              CONTEXT SANITIZER
                       │
                       ▼
                  RAKSHA AI
                       │
              ┌────────┴────────┐
              ▼                 ▼
         NVIDIA NIM        LOCAL FALLBACK
              │                 │
              └────────┬────────┘
                       ▼
                 EXPLANATION
```

### AI failure does not equal security failure.

```text
NVIDIA NIM unavailable
          ↓
Local provider
          ↓
Heuristic fallback
          ↓
KAVACH continues operating
```

---

# 🔐 CONTEXT SANITIZATION

Before external AI processing, sensitive context is sanitized.

```text
🔑 API KEYS
🔒 PASSWORDS
🎫 BEARER TOKENS
👤 PII
🪪 AUTHENTICATION SECRETS
```

The AI layer is intentionally treated as an **advisory intelligence component**, not the authoritative detection source.

---

# ⚡ SOAR RESPONSE ENGINE

<div align="center">

```text
                 🚨 SECURITY INCIDENT
                          │
                          ▼
                ┌──────────────────┐
                │ INCIDENT ENGINE  │
                └────────┬─────────┘
                         ▼
                 ┌───────────────┐
                 │ AUTHORIZATION │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │    PLAYBOOK   │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │     DRY RUN   │
                 └───────┬───────┘
                         ▼
                  HUMAN APPROVAL
                         │
                         ▼
                 ⚡ EXECUTION
                         │
                         ▼
                  📜 AUDIT LOG
                         │
                         ▼
                   ↩️ ROLLBACK
```

</div>

### Response playbooks

| Playbook               | Actions                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| 🦠 Ransomware          | Process containment → file quarantine → network isolation → alert |
| 🔑 Credential Dumping  | Process containment → session response → token invalidation       |
| 🔨 Brute Force         | Detection → source blocking → alert                               |
| 🌐 Malicious Domain    | Domain analysis → policy action → audit                           |
| 🔬 Evidence Collection | Gather relevant forensic evidence                                 |

Every high-impact response path is designed around **authorization, dry-run capability, auditability, and rollback**.

---

# 🖥️ SOC EXPERIENCE

## 👤 Normal User Mode

```text
╔══════════════════════════════════════╗
║                                      ║
║             🛡️ KAVACH                ║
║                                      ║
║              94 / 100                ║
║                                      ║
║        🟢 YOU ARE PROTECTED          ║
║                                      ║
║     Everything looks normal.         ║
║                                      ║
╚══════════════════════════════════════╝
```

Simple.

Calm.

Understandable.

---

## 🧑‍💻 Analyst Mode

```text
┌──────────────────────────────────────────────────────┐
│ INCIDENT #KVC-1042                     🔴 CRITICAL   │
├──────────────────────────────────────────────────────┤
│ Host          DESKTOP-01                             │
│ PID           4832                                    │
│ Parent PID    920                                     │
│ Technique     PowerShell                              │
│ Tactic        Execution                               │
│ IOC           Correlated                              │
│ ML State      READY                                   │
│ Risk          91 / 100                                │
│ Correlation   CLUSTER-17                              │
├──────────────────────────────────────────────────────┤
│ RAKSHA AI                                               │
│ "Multiple behavioral indicators support escalation." │
└──────────────────────────────────────────────────────┘
```

---

# 🌌 SOC VISUALIZATION

KAVACH's web SOC is designed around a modern security-operations aesthetic:

* 🌌 Glassmorphic interface
* 🛡️ Interactive 3D cyber shield
* 📡 Real-time WebSocket telemetry
* 📊 Chart.js analytics
* ⚡ Threat severity visualization
* 🌓 Dark / Light themes
* 📱 Responsive layouts
* 🧠 Embedded AI assistance

---

# ⚔️ CHAKRA ATTACK GRAPH & BLAST RADIUS VISUALIZER

<div align="center">

```text
            ADVERSARY ENTRY POINT
                     │
                     ▼
        ┌────────────────────────┐
        │  INITIAL COMPROMISE   │
        │  Spear-Phish / USB    │
        └───────────┬───────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   ┌──────────────┐   ┌──────────────┐
   │  CREDENTIAL  │   │  LATERAL     │
   │  DUMPING     │   │  MOVEMENT    │
   │  (Mimikatz)  │   │  (SMB/RDP)   │
   └──────┬───────┘   └──────┬───────┘
          │                  │
          └────────┬─────────┘
                   ▼
        ┌────────────────────┐
        │   CROWN JEWELS     │
        │  Domain Controller │
        │  SCADA / PLC / OT  │
        └────────┬───────────┘
                 │
                 ▼
          🛡️ KAVACH CONTAINS
          BLAST RADIUS (<50ms)
```

</div>

The **Chakra Attack Graph** maps live adversary lateral movement across enterprise topology nodes, calculates the downstream blast radius of any compromised host, and enables **atomic 1-click containment** that simultaneously quarantines all endangered systems.

### Capabilities

* **Multi-stage attack path visualization** with SVG Bézier curves and animated threat particles
* **Dynamic blast radius calculation** — identifies all reachable hosts from any infected node
* **Atomic containment** — quarantine entire blast radius in a single API call (<50ms)
* **Scenario reset** — restore graph state for re-analysis
* **Forensic brief export** — download Markdown investigation reports
* **Pre-loaded threat intelligence scenarios**: APT29 (Nobelium), Akira Ransomware, FIN7 POS Lateral Movement
* **Interactive canvas zoom** — navigate complex multi-tier enterprise topologies

---

# 🏛️ SOVEREIGN INDIAN CERT-In COMPLIANCE SUITE

<div align="center">

```text
         SECURITY INCIDENT DETECTED
                    │
                    ▼
        ┌───────────────────────┐
        │   6-HOUR STATUTORY    │
        │   COUNTDOWN TIMER     │
        │  Section 70B IT Act   │
        └───────────┬───────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   ┌──────────────┐   ┌──────────────┐
   │  ANNEXURE-I  │   │  180-DAY     │
   │  AUTO-FILL   │   │  IMMUTABLE   │
   │  REPORT GEN  │   │  LOG VAULT   │
   └──────┬───────┘   └──────┬───────┘
          │                  │
          ▼                  ▼
   ┌──────────────┐   ┌──────────────┐
   │   .TXT/.JSON │   │ MERKLE HASH  │
   │   DOWNLOAD   │   │ INTEGRITY    │
   └──────────────┘   └──────────────┘
```

</div>

The **CERT-In Compliance Suite** ensures organizations meet mandatory Indian cybersecurity regulations under **Section 70B of the IT Act (2000)** and **CERT-In Directions 2022**.

### Capabilities

* **Statutory 6-hour countdown timer** — real-time urgency gauge for each detected incident
* **Automated Annexure-I generation** — pre-filled official government reporting notice with organization details, IOCs, MITRE techniques, and remedial actions
* **Dual-format export** — download as `.txt` plaintext notice or structured `.json` for `incident@cert-in.org.in`
* **180-day immutable log vault** — cryptographic search interface with SHA-256 Merkle root integrity proofs per block
* **National CERT-In advisories feed** — curated threat intelligence for Indian BFSI, manufacturing, and critical infrastructure

---

# 🕸️ MAYAJAAL DECEPTION TECHNOLOGY & HONEY-TOKEN FLEET

<div align="center">

```text
         ENTERPRISE NETWORK
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
 ┌────────┐ ┌────────┐ ┌────────┐
 │ HONEY  │ │ GHOST  │ │ HONEY  │
 │ FILE   │ │ SOCKET │ │ CRED   │
 │ .xlsx  │ │ TCP445 │ │ LSASS  │
 └───┬────┘ └───┬────┘ └───┬────┘
     │          │          │
     └──────────┼──────────┘
                ▼
     ┌─────────────────────┐
     │  ATTACKER TOUCHES   │
     │  ANY DECOY ASSET    │
     └──────────┬──────────┘
                ▼
     ┌─────────────────────┐
     │  INSTANT KILL <22ms │
     │  0% FALSE POSITIVE  │
     └─────────────────────┘
```

</div>

**Mayajaal** (मायाजाल — *web of illusion*) deploys invisible tripwire assets across the enterprise. Because no legitimate user ever touches these decoys, any interaction is **100% confirmed malicious** with zero false positives.

### Decoy Types

| Decoy Type | Example | Detection Target |
| :--- | :--- | :--- |
| 📄 Honey File | `passwords_corporate_master.xlsx` | Ransomware, infostealers |
| 🔑 Honey Credential | Fake Domain Admin in LSASS | Mimikatz credential dumping |
| 🌐 Ghost Socket | TCP 445 SMB listener | Internal lateral scanning |
| 🗂️ Registry Trap | `HKLM\...\CanaryPasswordStore` | Persistence enumeration scripts |

### Capabilities

* **Sub-22ms autonomous process neutralization** — kernel-level PID freeze and socket severance
* **Live canary bait download** — deploy `.env` / `.xlsx` documents with embedded webhook triggers
* **Decoy lifecycle management** — deploy, monitor, trip, and decommission decoys from the SOC console
* **Fleet-wide overview dashboard** — total active decoys, trip counts, mean containment latency

---

# ⚡ RAKSHA FLOW: VISUAL SOAR PLAYBOOK STUDIO

<div align="center">

```text
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ TRIGGER  │────▶│CONDITION │────▶│  ACTION  │────▶│  ACTION  │
  │ Entropy  │     │Score > 80│     │ Kill PID │     │ Isolate  │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
                         │
                         ▼
                   ┌──────────┐
                   │ RAKSHA   │
                   │ AI AUDIT │
                   └──────────┘

  [Add Node]  [Export JSON]  [▶ Simulate Playbook]
```

</div>

**Raksha Flow** is a visual drag-and-drop SOAR (Security Orchestration, Automation & Response) playbook studio that enables analysts to build, simulate, and deploy automated incident response workflows without writing code.

### Capabilities

* **Visual DAG canvas** — drag-and-drop nodes (Triggers → Conditions → Actions → AI) connected by animated Bézier curves
* **Prompt-to-playbook AI** — describe a scenario in plain English and Raksha AI synthesizes the complete multi-node workflow
* **Dry-run simulation** — test playbooks against sample telemetry with animated traveling particles and per-step latency profiling
* **Pre-built playbooks** — Ransomware Auto-Lock, Phishing URL Auto-Block, USB Air-Gap Shield
* **JSON export** — 1-click download of the complete node-link DAG for version control and CI/CD deployment
* **Node inspector** — inspect and calibrate individual node parameters, thresholds, and action types
* **Node deletion** — prune unwanted nodes directly from the inspector panel

---

# 📱 CROSS-PLATFORM SECURITY

```text
                       KAVACH CORE
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      🌐 WEB SOC        🧩 BROWSER        📱 MOBILE
          │              SHIELD              │
          │                                   │
          └─────────────────┬─────────────────┘
                            ▼
                       FASTAPI API
                            │
                       🛡️ SECURITY
```

Flutter client targets:

```text
Android
iOS
Windows
macOS
Linux
Web
```

---

# 🏗️ COMPLETE ARCHITECTURE

```mermaid
flowchart TB

    subgraph ENDPOINT["🖥️ ENDPOINT LAYER"]
        A1["Process"]
        A2["Network"]
        A3["FIM"]
        A4["Event Logs"]
        A5["Sysmon"]
        A6["PowerShell"]
        A7["DNS"]
        A8["Registry"]
        A9["USB"]
        A10["Defender"]
        A11["Tasks"]
        A12["Inventory"]
        A13["System"]
        A14["Canary"]
        A15["Services"]
        A16["Authentication"]
    end

    subgraph PIPELINE["⚙️ KAVACH CORE"]
        B1["Async Event Bus"]
        B2["Normalization"]
        B3["Deduplication"]
        B4["Rule Engine"]
        B5["Isolation Forest"]
        B6["Threat Intelligence"]
        B7["Hybrid Risk"]
        B8["Incident Correlation"]
        B9["Database"]
    end

    subgraph RESPONSE["⚡ RESPONSE"]
        C1["SOAR Registry"]
        C2["Authorization"]
        C3["Dry Run"]
        C4["Execution"]
        C5["Rollback"]
        C6["Audit"]
    end

    subgraph AI["🤖 RAKSHA AI"]
        D1["Sanitizer"]
        D2["NVIDIA NIM"]
        D3["Local Fallback"]
        D4["Security Explanation"]
    end

    subgraph CLIENTS["💻 CLIENTS"]
        E1["React SOC"]
        E2["Chromium MV3"]
        E3["Flutter"]
    end

    ENDPOINT --> B1
    B1 --> B2
    B2 --> B3

    B3 --> B4
    B3 --> B5
    B3 --> B6

    B4 --> B7
    B5 --> B7
    B6 --> B7

    B7 --> B8
    B8 --> B9
    B8 --> C1
    B8 --> D1

    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C4 --> C6

    D1 --> D2
    D2 --> D3
    D3 --> D4

    E1 <--> B1
    E2 <--> B7
    E3 <--> B1
    E1 <--> D4
```

---

# 🧰 TECHNOLOGY STACK

<div align="center">

### Backend

<img src="https://skillicons.dev/icons?i=python,fastapi,postgres,sqlite" />

### Frontend

<img src="https://skillicons.dev/icons?i=react,typescript,vite,threejs" />

### Mobile

<img src="https://skillicons.dev/icons?i=flutter,dart,androidstudio" />

### AI / Security

<img src="https://skillicons.dev/icons?i=sklearn" />

<br><br>

<img src="https://img.shields.io/badge/NVIDIA-NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white"/>
<img src="https://img.shields.io/badge/MITRE-ATT%26CK-FF3B30?style=for-the-badge"/>
<img src="https://img.shields.io/badge/WebSocket-Live-00E5FF?style=for-the-badge"/>
<img src="https://img.shields.io/badge/SOAR-Playbooks-8B5CF6?style=for-the-badge"/>

</div>

---

# 📁 REPOSITORY

```text
KAVACH/
│
├── 🛡️ backend/
│   ├── ai/
│   ├── api/
│   ├── auth/
│   ├── collectors/
│   ├── core/
│   ├── database/
│   ├── email_notifications/
│   ├── mitre/
│   ├── ml/
│   ├── pipeline/
│   ├── playbooks/
│   ├── reports/
│   ├── response/
│   ├── static/
│   ├── tests/
│   ├── threatintel/
│   ├── main.py
│   ├── requirements.txt
│   └── tui.py
│
├── 🌐 frontend/
│   ├── src/
│   └── package.json
│
├── 📱 mobile/
│   ├── lib/
│   ├── android/
│   ├── ios/
│   ├── linux/
│   ├── macos/
│   ├── windows/
│   ├── web/
│   └── pubspec.yaml
│
├── 🧩 extension/
│
├── 📚 Documents/
│
├── ⚙️ start_all_servers.bat
├── ⚙️ start_all_servers.ps1
├── 🚫 .gitignore
└── 📖 README.md
```

---

# 🚀 QUICK START

## 01 — Clone

```bash
git clone <YOUR_REPOSITORY_URL>
cd KAVACH
```

## 02 — Backend

```bash
cd backend
python -m venv venv
```

### Windows

```powershell
venv\Scripts\activate
```

### Install

```bash
pip install -r requirements.txt
```

---

# ⚙️ ENVIRONMENT

```powershell
copy .env.example .env
```

Example:

```env
JWT_SECRET=your-secure-secret

GEMINI_API_KEY=
NVIDIA_API_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
```

> 🔐 Never commit real credentials, API keys, tokens, or passwords.

---

# ▶️ RUN KAVACH

### Full XDR Mode

```bash
python main.py
```

### Lightweight Development Mode

```bash
python main.py --no-collectors
```

---

# 🌐 SERVICES

| Service      | Location               |
| ------------ | ---------------------- |
| 🛡️ Backend  | `localhost:8000`       |
| 📚 Swagger   | `localhost:8000/docs`  |
| 📖 ReDoc     | `localhost:8000/redoc` |
| 🌐 React SOC | `localhost:5173`       |
| 🖥️ TUI      | `python tui.py`        |

---

# 🌐 FRONTEND

```bash
cd frontend
npm install
npm run dev
```

---

# 📱 MOBILE

```bash
cd mobile
flutter pub get
flutter run
```

---

# 🔌 API SURFACE

```text
AUTH
├── POST /api/v1/auth/register
├── POST /api/v1/auth/login
└── POST /api/v1/auth/verify-otp

DASHBOARD
├── GET /api/v1/dashboard/summary
└── WS  /api/v1/dashboard/live

ALERTS
├── GET  /api/v1/alerts
└── POST /api/v1/alerts/{id}/explain

INCIDENTS
└── GET /api/v1/incidents

THREAT INTELLIGENCE
└── POST /api/v1/threats/analyze-url

MITRE
├── GET /api/v1/mitre/techniques
└── GET /api/v1/mitre/heatmap

SOAR
└── POST /api/v1/playbooks/execute

RAKSHA AI
└── POST /api/v1/chatbot/soc

REPORTING
└── GET /api/v1/reports/soc

SYSTEM
└── GET /api/v1/system/health

ATTACK GRAPH (Chakra)
├── GET  /api/v1/graph/overview
├── GET  /api/v1/graph/attack-tree/{scenario_id}
├── POST /api/v1/graph/contain-blast-radius
└── POST /api/v1/graph/reset-scenario/{scenario_id}

CERT-In COMPLIANCE
├── GET  /api/v1/compliance/cert-in/audit-vault-status
├── GET  /api/v1/compliance/cert-in/advisories
├── POST /api/v1/compliance/cert-in/generate-report/{incident_id}
├── GET  /api/v1/compliance/cert-in/download-annexure/{incident_id}
├── POST /api/v1/compliance/cert-in/search-vault
└── POST /api/v1/compliance/cert-in/mark-reported/{incident_id}

MAYAJAAL DECEPTION
├── GET    /api/v1/deception/overview
├── GET    /api/v1/deception/decoys
├── POST   /api/v1/deception/deploy
├── DELETE /api/v1/deception/decoys/{decoy_id}
├── GET    /api/v1/deception/download-canary/{decoy_id}
├── GET    /api/v1/deception/tripwire-logs
└── POST   /api/v1/deception/tripwire/simulate

RAKSHA FLOW STUDIO
├── GET  /api/v1/raksha-flow/workflows
├── GET  /api/v1/raksha-flow/workflows/{workflow_id}
├── POST /api/v1/raksha-flow/workflows
├── POST /api/v1/raksha-flow/simulate
└── POST /api/v1/raksha-flow/generate-ai
```

---

# 🔐 SECURITY MODEL

```text
                    REQUEST
                       │
                       ▼
                ┌─────────────┐
                │    AUTH     │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │    RBAC     │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │ VALIDATION  │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │   ENGINE    │
                └──────┬──────┘
                       ▼
             ┌─────────┴─────────┐
             ▼                   ▼
          ANALYSIS             ACTION
             │                   │
             ▼                   ▼
        RISK ENGINE          SOAR GUARD
             │                   │
             └─────────┬─────────┘
                       ▼
                   AUDIT LOG
```

---

# 👥 RBAC

| Capability             | 🛡️ SOC Analyst | 👤 Normal User |
| ---------------------- | :-------------: | :------------: |
| Security Score         |        ✅        |        ✅       |
| Personal Alerts        |        ✅        |        ✅       |
| Security Tips          |        ✅        |        ✅       |
| Raksha AI              |        ✅        |        ✅       |
| Live Telemetry         |        ✅        |        ❌       |
| MITRE Matrix           |        ✅        |        ❌       |
| Threat Hunting         |        ✅        |        ❌       |
| Incident Investigation |        ✅        |        ❌       |
| Collector Management   |        ✅        |        ❌       |
| SOAR                   |        ✅        |        ❌       |
| Device Isolation       |        ✅        |        ❌       |
| Quarantine             |        ✅        |        ❌       |
| Evidence Collection    |        ✅        |        ❌       |

---

# 🧪 TESTING

```bash
pytest
```

Coverage areas include:

```text
Authentication
API Security
Telemetry
ML
MITRE Detection
Threat Intelligence
Incident Correlation
SOAR
Security Controls
```

---

# 💡 DESIGN PRINCIPLES

<div align="center">

| Principle               | Meaning                                             |
| ----------------------- | --------------------------------------------------- |
| 🧠 **Evidence First**   | Decisions originate from observable evidence        |
| 🤖 **AI Assists**       | AI explains; it does not become the source of truth |
| 🚫 **No Fake ML**       | Insufficient data means no fabricated prediction    |
| 🛡️ **Fail Safe**       | AI/service failure does not disable core security   |
| 🔐 **Least Privilege**  | Access is limited by role and capability            |
| 👤 **Human Control**    | High-impact actions require authorization           |
| 📜 **Audit Everything** | Security actions remain traceable                   |
| ↩️ **Rollback**         | Response workflows support controlled recovery      |
| 🧩 **Decoupled Core**   | Backend remains independent from the frontend       |

</div>

---

# 📊 KAVACH SECURITY LOOP

```text
                       ┌──────────────┐
                       │    SENSE     │
                       │  Telemetry   │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │    DETECT    │
                       │ Rules + ML   │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   CORRELATE  │
                       │  Incidents   │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   EXPLAIN    │
                       │  Raksha AI   │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   RESPOND    │
                       │     SOAR     │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   PROTECT    │
                       │   + AUDIT    │
                       └──────┬───────┘
                              │
                              └───────────────► SENSE
```

---

# 🗺️ ROADMAP

```text
                     KAVACH
                       │
                       ▼
              ┌─────────────────┐
              │   FOUNDATION    │
              │ API + Telemetry │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  INTELLIGENCE   │
              │ ML + MITRE + TI │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │   AUTOMATION    │
              │     SOAR        │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │    RAKSHA AI    │
              │ Copilot Layer   │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ MULTI-PLATFORM  │
              │ Web + Mobile    │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │   ENTERPRISE    │
              │ Distributed XDR │
              └─────────────────┘
```

### Next-Generation Goals

* [ ] Multi-host endpoint fleet
* [ ] Distributed telemetry ingestion
* [x] Advanced incident graph — **Chakra Attack Graph & Blast Radius Visualizer**
* [ ] Threat-hunting workspace
* [ ] Cloud telemetry
* [ ] Container telemetry
* [ ] Expanded TI providers
* [ ] Detection-rule builder
* [x] Visual SOAR workflow builder — **Raksha Flow Studio**
* [ ] Enterprise PostgreSQL architecture
* [ ] High-availability deployment
* [ ] Expanded ATT&CK coverage
* [ ] Advanced security analytics
* [x] Indian regulatory compliance — **CERT-In Compliance Suite**
* [x] Active deception technology — **Mayajaal Honey-Token Fleet**

---

# 🏆 WHY KAVACH?

Most security environments look like:

```text
EDR ─────────┐
SIEM ────────┤
SOAR ────────┤
Threat Intel ┤
URL Security ├────► DISCONNECTED TOOLS
AI ──────────┤
Mobile ──────┘
```

KAVACH's vision:

```text
                 ┌─────────────────────┐
                 │       KAVACH        │
                 │                     │
                 │       DETECT        │
                 │          ↓          │
                 │      CORRELATE      │
                 │          ↓          │
                 │      INVESTIGATE    │
                 │          ↓          │
                 │       RAKSHA AI     │
                 │          ↓          │
                 │        SOAR         │
                 │          ↓          │
                 │       PROTECT       │
                 └─────────────────────┘
```

---

# 📡 SECURITY STATUS

<div align="center">

<img src="https://img.shields.io/badge/TELEMETRY-LIVE-00FF9C?style=for-the-badge"/>
<img src="https://img.shields.io/badge/ML-BEHAVIORAL-8B5CF6?style=for-the-badge"/>
<img src="https://img.shields.io/badge/MITRE-MAPPED-FF3B6B?style=for-the-badge"/>
<img src="https://img.shields.io/badge/THREAT%20INTEL-ACTIVE-00E5FF?style=for-the-badge"/>
<img src="https://img.shields.io/badge/SOAR-CONTROLLED-FFA726?style=for-the-badge"/>
<img src="https://img.shields.io/badge/RAKSHA%20AI-READY-8B5CF6?style=for-the-badge"/>

<br><br>

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    🛡️  K A V A C H                           ║
║                                                              ║
║             CONTINUOUS SECURITY INTELLIGENCE                ║
║                                                              ║
║       SENSE  •  DETECT  •  CORRELATE  •  EXPLAIN            ║
║                                                              ║
║                    RESPOND  •  PROTECT                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

</div>

---

# 📜 LICENSE

**Proprietary — All Rights Reserved**

Copyright © KAVACH Security Platform.

Unauthorized copying, redistribution, modification, or commercial use is prohibited unless explicitly authorized by the project owner.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=150&color=0:001F29,50:061B2B,100:05070D&section=footer&animation=twinkling"/>

## 🛡️ KAVACH

### `ONE SHIELD. ONE SECURITY FABRIC.`

**AI • XDR • SOAR • ML • MITRE • THREAT INTELLIGENCE**

<br>

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=18&duration=3000&pause=1000&color=00E5FF&center=true&vCenter=true&width=700&lines=DETECT.;CORRELATE.;UNDERSTAND.;RESPOND.;PROTECT." alt="KAVACH closing animation"/>

<br><br>

⭐ **If KAVACH is useful, star the repository and follow its evolution.**

</div>
