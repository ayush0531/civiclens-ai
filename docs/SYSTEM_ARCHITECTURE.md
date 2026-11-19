# CivicLens AI — System Architecture & Engineering Specification

## 1. Executive Summary & Architectural Overview

**CivicLens AI** is an enterprise-grade civic infrastructure intelligence and municipal grievance orchestration platform engineered specifically for the metropolitan urban jurisdiction of **Nagpur Municipal Corporation (NMC)**, Maharashtra, India. 

The system transitions municipal road maintenance from passive, unverified citizen complaints to an **automated, evidence-verified, priority-ranked infrastructure management lifecycle**. By pairing lightweight edge-capable computer vision models (ONNX Runtime YOLOv8) with an Explainable Multi-Criteria Priority Engine and a robust Municipal Integration Gateway, CivicLens AI bridges the technological divide between citizens and urban local bodies.

---

## 2. High-Level Architectural Models (C4 Model)

### Level 1: System Context Diagram

```mermaid
flowchart TD
    Citizen["Nagpur Citizen<br/>(Mobile / Desktop Browser)"]
    Officer["NMC Zonal Officer / Engineer<br/>(Municipal Dashboard)"]
    Admin["System Administrator<br/>(Governance & Policies)"]
    
    subgraph CivicLensBoundary ["CivicLens AI Platform Boundary"]
        CivicLens["CivicLens AI System<br/>(FastAPI Core + Vite React)"]
    end
    
    NMCExternal["Nagpur Municipal Corporation (NMC)<br/>Official Grievance Portal & Gateway"]
    OSMTiles["Public Tile Infrastructure<br/>(OpenStreetMap / Esri ArcGIS)"]
    
    Citizen -->|"1. Submits geotagged photo<br/>2. Tracks complaint status"| CivicLens
    Officer -->|"Triage, inspects AI evidence,<br/>verifies repair resolution"| CivicLens
    Admin -->|"Tunes 6-factor policy weights,<br/>monitors audit logs & gateway"| CivicLens
    CivicLens -->|"Dispatches verified complaints via<br/>Simulated / Authorized Adapter"| NMCExternal
    CivicLens -->|"Renders geospatial base maps"| OSMTiles
```

---

### Level 2: Container Architecture

The system is decomposed into four primary decoupled containers:

```mermaid
flowchart LR
    subgraph ClientTier ["Frontend Presentation Container"]
        SPA["React 18 Single Page Application<br/>(TypeScript, TailwindCSS, Vite)"]
        State["Zustand / Context State<br/>(Auth, Telemetry, Cache)"]
        SPA --- State
    end

    subgraph APITier ["Backend API & Services Container"]
        FastAPI["FastAPI 0.100+ Application<br/>(Uvicorn ASGI Worker)"]
        VerifyEngine["5-Stage Verification Engine"]
        AIEngine["ONNX Runtime Inference Engine<br/>(YOLOv8-RDD2022)"]
        PriorityEngine["Explainable 6-Factor Priority Ranker"]
        NMCGateway["NMC Adapter & Gateway<br/>(Idempotency & Auditing)"]
        RepairEngine["Before/After Repair Inspector"]
        NLParser["NLP Grievance Parser"]
        
        FastAPI --> VerifyEngine
        FastAPI --> PriorityEngine
        FastAPI --> NMCGateway
        FastAPI --> RepairEngine
        FastAPI --> NLParser
        VerifyEngine --> AIEngine
        RepairEngine --> AIEngine
    end

    subgraph DataTier ["Persistence & Storage Container"]
        RDBMS[("Relational Database<br/>SQLite WAL / PostgreSQL 15")]
        Uploads[("Secure Media Storage<br/>Raw & Annotated JPEGs")]
    end

    SPA -->|"RESTful JSON APIs over TLS"| FastAPI
    FastAPI -->|"SQLAlchemy 2.0 ORM"| RDBMS
    FastAPI -->|"Local / Object Storage"| Uploads
```

---

### Level 3: Component Interactions & Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen User
    participant Frontend as Vite React SPA
    participant API as FastAPI Router
    participant Verifier as 5-Stage Verification Engine
    participant ONNX as YOLOv8 ONNX Runtime
    participant Priority as Multi-Criteria Engine
    participant Adapter as NMC Gateway Adapter
    participant DB as Relational Database

    Citizen->>Frontend: Capture & Upload Damage Image + GPS
    Frontend->>API: POST /api/reports (Multipart Form)
    API->>DB: Store Raw Report (Workflow: SUBMITTED, Ext: NOT_REGISTERED)
    
    critical 5-Stage Verification Execution
        API->>Verifier: run_full_pipeline(report, image)
        Verifier->>Verifier: Stage 1: Laplacian Variance Blur Rejection (σ² ≥ 85.0)
        Verifier->>ONNX: Stage 2: Tensor Inference (640x640 Input, NMS IoU=0.45)
        ONNX-->>Verifier: Bounding Boxes, Class Label, Softmax Confidence
        Verifier->>Verifier: Stage 3: Optical Surface Area Estimation & SLA Deadlines
        Verifier->>Verifier: Stage 4: Nagpur Municipal Bounding Check & Zone Allocation
        Verifier->>DB: Stage 5: Haversine Spatial (120m) & dHash Visual Screening
        Verifier->>DB: Persist 5 ReportVerificationStage Audit Rows
    end

    API->>Priority: calculate_priority_score(report)
    Priority-->>API: 6-Factor Composite Priority Score (0 - 100)
    API->>DB: Update Report Telemetry & Audit Logs
    API-->>Frontend: 201 Created (Hydrated ReportDetailResponse)

    opt Citizen / Officer Initiates NMC Dispatch
        Frontend->>API: POST /api/reports/{id}/submit-nmc
        API->>Adapter: dispatch_complaint(report, idempotency_key)
        Adapter->>DB: Check Idempotency Key in NMCTransactionAudit
        Adapter->>Adapter: Route via SimulatedNMCAdapter or AuthorizedNMCAdapter
        Adapter->>DB: Commit NMCTransactionAudit (HTTP 200, Official Ref ID)
        API-->>Frontend: Updated Dual Status (Official Ref: NMC-SIM-2026-XXXX)
    end
```

---

## 3. Dual-Status Lifecycle Synchronization Model

To prevent false claims of government submission while providing a complete civic operations simulation, CivicLens maintains **two orthogonal status fields** on every incident record:

| Aspect | Internal Workflow Status (`workflow_status`) | External Municipal Submission Status (`external_submission_status`) |
| :--- | :--- | :--- |
| **Authority** | Controlled by CivicLens AI and municipal triage officers. | Controlled exclusively by the NMC Municipal Gateway Adapter. |
| **Allowed Values** | `SUBMITTED`<br/>`UNDER_REVIEW`<br/>`ACTION_PLANNED`<br/>`IN_PROGRESS`<br/>`RESOLVED`<br/>`REJECTED` | `NOT_REGISTERED`<br/>`PENDING_VERIFICATION`<br/>`OFFICIALLY_REGISTERED`<br/>`RESOLVED_ON_PORTAL`<br/>`PORTAL_REJECTED` |
| **Purpose** | Drives operational repair workflow, SLA countdowns, priority queuing, and field assignments. | Reflects non-repudiable state in the municipal gateway with external reference numbers. |
| **Demo Rule** | Fully operational in demo and production environments. | Dispatches simulated responses (`[SIMULATED DEMONSTRATION MODE]`) unless an authorized endpoint is authenticated. |

---

## 4. Security Perimeter & Governance Safeguards

1. **Role-Based Access Control (RBAC):**
   - **`citizen`**: Can submit reports, run client-side previews, track public complaints by reference, and dispute closed repairs.
   - **`authority` (Municipal Officer):** Can triage incident queues, filter by administrative ward, update status, and perform AI-driven repair inspections.
   - **`admin` (System Administrator):** Can tune 6-factor priority weights, manage user roles, configure the NMC Gateway adapter, and execute test database resets.
2. **Idempotency Safeguards:**
   - Every dispatch to the external municipal gateway requires a deterministic `idempotency_key` generated via `SHA-256(ref_number + lat + lon + timestamp_window)`. Duplicate transmissions return cached audit records without side effects.
3. **Citizen Privacy Masking:**
   - Public tracking endpoints (`GET /api/reports/track/{ref}`) mask phone numbers, citizen email addresses, and reporter identities to protect citizen confidentiality under public disclosure guidelines.
4. **Non-Destructive Database Migrations:**
   - Lightweight column inspection and SQLite PRAGMA table scans add missing schema columns and create tables on startup without data wipes or loss of historical records.
