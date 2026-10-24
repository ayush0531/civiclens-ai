# CivicLens AI: System Architecture & Technical Design

---

## 1. High-Level Component Architecture

CivicLens AI follows a modular, decoupled client-server architecture ensuring high maintainability, stateless API scalability, and clean separation of concerns.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Presentation Layer (React + TypeScript + Vite)"]
        UI["Tailwind Enterprise UI"]
        AuthUI["Role-Based Navigation & Auth Context"]
        MapView["Leaflet Geospatial Map (OSM Tiles)"]
        ChartsView["Recharts Analytics Dashboard"]
        Inspector["AI Detection Overlay & Case Inspector"]
    end

    subgraph APILayer["Backend Application Layer (FastAPI REST Services)"]
        Gateway["FastAPI Gateway / CORS / Lifespan Engine"]
        AuthRouter["Auth & RBAC (Argon2 / JWT)"]
        ReportRouter["Report CRUD & Validation"]
        InferenceRouter["AI Road Damage Service (EdgeCV / YOLO)"]
        DuplicateRouter["Haversine & dHash Duplicate Engine"]
        PriorityRouter["Multi-Criteria Priority Ranking Engine"]
        WorkflowRouter["Status Transitions & Maintenance Assignments"]
        AnalyticsRouter["Dynamic KPI & Hotspot Aggregator"]
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        DB[("SQLite Relational DB (WAL Mode)")]
        MediaStorage["Secure Media File Storage (/uploads)"]
        AuditTrail[("Cryptographic Audit Log")]
    end

    ClientLayer <-->|JSON REST API & Multipart Form Data| APILayer
    APILayer <-->|SQLAlchemy ORM| DB
    APILayer <-->|Safe File I/O| MediaStorage
    APILayer -->|Append-Only| AuditTrail
```

---

## 2. End-to-End Defect Triage Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen Reporter
    participant FE as React Client
    participant API as FastAPI Backend
    participant AI as AI Inference Engine
    participant Dup as Duplicate Detection
    participant Prio as Priority Engine
    participant DB as SQLite Storage
    actor Authority as Municipal Authority

    Citizen->>FE: Capture Photo & Pin Location on Map
    FE->>API: POST /api/v1/reports (Multipart Form)
    API->>DB: Persist Initial Report (Status: SUBMITTED)
    API->>Dup: Check nearby reports (< 120m, dHash match)
    Dup-->>API: Duplicate Candidates & Distance
    API->>AI: analyze_image(image_path)
    AI-->>API: Predicted Class, Bounding Boxes, Severity Score
    API->>Prio: calculate_priority(Severity, Conf, Dups, Aging, RoadTier)
    Prio-->>API: Final Priority Score & Factor Breakdown
    API->>DB: Store AIAnalysis, Update Report Priority & Status History
    API-->>FE: Return ReportDetail with Bounding Overlays
    
    Authority->>FE: Inspect Prioritized Triage Queue
    FE->>API: GET /api/v1/reports?sort_by=priority_score
    API-->>FE: Ranked Work Orders
    Authority->>FE: Assign Maintenance Crew
    FE->>API: POST /api/v1/reports/{id}/assign
    API->>DB: Update Status to ASSIGNED, Record AuditLog
    API-->>FE: Updated Case Confirmation
```

---

## 3. Database Entity-Relationship Model

```mermaid
erDiagram
    User ||--o{ RoadDamageReport : "submits"
    User ||--o{ MaintenanceAssignment : "assigned_by"
    User ||--o{ MaintenanceAssignment : "assigned_to"
    User ||--o{ StatusHistory : "transitions"
    User ||--o{ AuditLog : "triggers"
    User ||--o{ Feedback : "provides"

    RoadDamageReport ||--o{ AIAnalysis : "analyzed_by"
    RoadDamageReport ||--o{ MaintenanceAssignment : "generates"
    RoadDamageReport ||--o{ StatusHistory : "records"
    RoadDamageReport ||--o{ Feedback : "receives"
    RoadDamageReport ||--o| RoadDamageReport : "duplicate_of"

    User {
        int id PK
        string name
        string email UK
        string password_hash
        string role "citizen | authority | admin"
        string department
        boolean is_active
        datetime created_at
    }

    RoadDamageReport {
        int id PK
        string reference_number UK
        int reporter_id FK
        string title
        text description
        string image_path
        string annotated_image_path
        float latitude
        float longitude
        string address_text
        string road_classification
        string predicted_damage_category
        float prediction_confidence
        float severity_score
        string severity_level
        float priority_score
        string workflow_status
        int assigned_authority_id FK
        int duplicate_reference_id FK
        boolean is_duplicate
        float duplicate_confidence
        string resolution_notes
        string resolution_image_path
        boolean is_demo_data
        datetime created_at
    }

    AIAnalysis {
        int id PK
        int report_id FK
        string model_identifier
        string model_version
        string inference_mode
        text predicted_classes
        text confidence_scores
        text bounding_boxes
        text severity_breakdown
        float inference_duration_ms
        boolean is_demo_result
        string disclaimer
        datetime created_at
    }

    MaintenanceAssignment {
        int id PK
        int report_id FK
        int assigned_by_id FK
        int assigned_to_id FK
        text notes
        string priority_level
        string assignment_status
        datetime target_completion_date
        datetime assigned_at
        datetime completed_at
    }

    StatusHistory {
        int id PK
        int report_id FK
        string previous_status
        string new_status
        int changed_by_id FK
        text notes
        datetime timestamp
    }

    AuditLog {
        int id PK
        int actor_id FK
        string action
        string target_type
        string target_id
        text metadata_json
        string ip_address
        datetime timestamp
    }
```

---

## 4. REST API Endpoint Specifications

All REST endpoints are versioned under `/api/v1` and documented in Swagger UI at `/docs`.

| Method | Endpoint | Description | Role Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health, DB connection, AI engine mode | Public |
| `POST` | `/api/v1/auth/register` | User account registration | Public |
| `POST` | `/api/v1/auth/login` | JWT authentication token issuance | Public |
| `GET` | `/api/v1/auth/me` | Fetch active profile and permissions | Authenticated |
| `GET` | `/api/v1/reports` | List reports with search, filters, pagination | Public / Auth |
| `POST` | `/api/v1/reports` | Create report with photo upload & coordinates | Public / Citizen |
| `GET` | `/api/v1/reports/{id}` | Full case details, analyses, history, duplicates | Public / Auth |
| `PATCH` | `/api/v1/reports/{id}` | Edit report title or classification | Reporter / Authority |
| `DELETE` | `/api/v1/reports/{id}` | Remove report record | Admin only |
| `POST` | `/api/v1/reports/{id}/analyze` | Trigger manual computer vision re-inference | Authenticated |
| `POST` | `/api/v1/reports/{id}/assign` | Assign maintenance crew to defect | Authority / Admin |
| `POST` | `/api/v1/reports/{id}/status` | Transition legal lifecycle status | Authority / Admin |
| `POST` | `/api/v1/reports/{id}/resolve` | Close case with maintenance evidence photo | Authority / Admin |
| `GET` | `/api/v1/map/reports` | Optimized geo-points for Leaflet map markers | Public |
| `GET` | `/api/v1/analytics/overview` | Dynamic municipal KPI counters | Public |
| `GET` | `/api/v1/analytics/trends` | Category, severity, and hotspot aggregations | Public |
| `GET` | `/api/v1/admin/users` | List all registered user accounts | Admin only |
| `PATCH` | `/api/v1/admin/users/{id}/role` | Update user roles and access status | Admin only |
| `POST` | `/api/v1/admin/reseed` | Restore synthetic Nagpur demo fixtures | Admin only |
| `GET` | `/api/v1/admin/system-status` | DB entity counts, storage, AI engine stats | Authority / Admin |
| `GET` | `/api/v1/audit-logs` | Cryptographic audit trail of system events | Authority / Admin |
