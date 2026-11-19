# CivicLens AI — REST API OpenAPI Contract & Endpoint Reference

## 1. API Protocol & Base URLs

- **API Version:** `v2.0.0`
- **Protocol:** HTTPS / TLS 1.3
- **Base URL (Local Development):** `http://localhost:8000/api`
- **Base URL (Render Production):** `https://civiclens-ai.onrender.com/api`
- **Documentation UI:** Interactive Swagger UI available at `/docs` and ReDoc at `/redoc`.

---

## 2. Authentication & Authorization Headers

CivicLens uses standard OAuth2 Password Bearer tokens with JWT (JSON Web Tokens).

```http
Authorization: Bearer <access_token>
```

| Role | Permissions |
| :--- | :--- |
| `citizen` | Submit reports, track public complaints, dispute repair resolutions. |
| `authority` | Municipal queue triage, ward filtering, repair verification inspections. |
| `admin` | Tune priority policy weights, reseed demo records, manage NMC Gateway config. |

---

## 3. Core Endpoint Catalog

### Authentication Endpoints (`/api/auth`)

#### `POST /auth/register`
Creates a citizen or authority user account.
- **Request:** `{ "name": "Ayush", "email": "ayush@example.com", "password": "Pass", "role": "citizen" }`
- **Response (201):** User profile object.

#### `POST /auth/login`
Authenticates user and issues access token.
- **Request (Form Data):** `username=ayush@example.com&password=Pass`
- **Response (200):** `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

#### `GET /auth/me`
Returns current authenticated user context and role.

---

### Incident Reporting & 5-Stage Verification (`/api/reports`)

#### `POST /reports`
Submits a road defect report and executes the automated 5-Stage Verification Pipeline.
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `title` (string, required, 5-150 chars)
  - `latitude` (float, required, $[-90, 90]$)
  - `longitude` (float, required, $[-180, 180]$)
  - `description` (string, optional)
  - `address_text` (string, optional)
  - `landmark` (string, optional)
  - `area_locality` (string, optional, e.g. "Dharampeth")
  - `road_classification` (string, `LOCAL`, `COLLECTOR`, `ARTERIAL`, `HIGHWAY`)
  - `reporter_name` (string, optional)
  - `reporter_contact` (string, optional)
  - `image` (binary file, required, JPEG/PNG/WebP, max 10MB)
- **Response (201):** `ReportDetailResponse` with populated `verification_stages`, `priority_score`, and `sla_deadline_at`.

#### `GET /reports/track/{identifier}`
Public tracking endpoint for citizens.
- **Path Parameter:** `identifier` (e.g. `CVL-2026-0001`, database numeric ID, or official `NMC-SIM-2026-XXXX`).
- **Response (200):** Masked citizen tracking response including resolution stepper, SLA status, verification telemetry, and before/after repair evidence.

#### `POST /reports/{id}/submit-nmc`
Dispatches a verified report to the NMC municipal integration gateway.
- **Query Parameters:** `idempotency_key` (string, optional), `notes` (string, optional).
- **Response (200):** Updated report with `external_submission_status="OFFICIALLY_REGISTERED"` and `external_reference_id`.

#### `POST /reports/{id}/verify-repair`
Executes computer vision Before-and-After photogrammetric repair inspection.
- **Form Data:** `repair_image` (file, required), `repair_notes` (string, optional).
- **Response (200):** `RepairResolutionEvidence` object with `residual_damage_index` and `verification_status`.

#### `POST /reports/{id}/reopen`
Submits a citizen dispute against a resolved complaint.
- **Form Data:** `reason` (string, enum), `comments` (string, required), `citizen_name` (string, optional).
- **Response (200):** Reopened report detail with incremented `reopened_count` and workflow status reset to `UNDER_REVIEW`.

---

### Natural Language Grievance AI (`/api/ai`)

#### `POST /ai/parse-nl-report`
Parses unstructured citizen text (Marathi / Hindi / English).
- **Request Body:** `{ "text": "Khup motha gadda Dharampeth coffee house javal WHC road var..." }`
- **Response (200):**
  ```json
  {
    "parsed_successfully": true,
    "distress_type": "Pothole",
    "suggested_severity": "HIGH",
    "landmark": "Dharampeth Coffee House",
    "ward_name": "Dharampeth",
    "suggested_title": "Severe Pothole near Dharampeth Coffee House",
    "summary": "Reported severe pothole in Dharampeth near Dharampeth Coffee House."
  }
  ```

---

### Geospatial & Wards (`/api/map`)

#### `GET /map/markers`
Returns geocoded defect pins filtered by category, severity level, or status.

#### `GET /map/clusters`
Returns spatial clusters computed via DBSCAN algorithm.
- **Query Parameters:** `eps_radius` (default $450.0$), `min_samples` (default $2$).

#### `GET /map/wards`
Returns the 10 Nagpur Municipal Corporation administrative zones with boundary GeoJSON polygons and live defect counts.

---

### Governance & NMC Gateway Admin (`/api/admin`)

#### `GET /admin/nmc/config`
Retrieves current municipal gateway adapter configuration.

#### `PUT /admin/nmc/config`
Updates gateway adapter operating mode (`SIMULATED` vs `OFFICIAL_API`), endpoint URL, timeout, and retry limits.

#### `GET /admin/nmc/health`
Executes gateway connectivity ping and latency test.

#### `GET /admin/nmc/transactions`
Retrieves immutable transaction audit logs with idempotency keys and gateway payloads.
