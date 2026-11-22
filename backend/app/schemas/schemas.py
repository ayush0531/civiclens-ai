from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=12, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdateRole(BaseModel):
    role: str = Field(..., pattern="^(citizen|authority|admin)$")
    is_active: Optional[bool] = None
    department: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int

# ----------------- AI Detection Schemas -----------------
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    label: str
    confidence: float

class AIAnalysisResponse(BaseModel):
    id: int
    report_id: int
    model_identifier: str
    model_version: str
    inference_mode: str
    predicted_classes: List[str]
    confidence_scores: List[float]
    bounding_boxes: List[Dict[str, Any]]
    severity_breakdown: Dict[str, Any]
    analysis_metadata: Optional[Dict[str, Any]] = None
    inference_duration_ms: float
    is_demo_result: bool
    disclaimer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Status & Workflow Schemas -----------------
class StatusHistoryResponse(BaseModel):
    id: int
    report_id: int
    previous_status: str
    new_status: str
    changed_by_name: Optional[str] = None
    changed_by_role: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class StatusTransitionRequest(BaseModel):
    new_status: str = Field(..., pattern="^(SUBMITTED|UNDER_REVIEW|ACTION_PLANNED|ASSIGNED|IN_PROGRESS|RESOLVED|REJECTED)$")
    notes: Optional[str] = None
    resolution_image_path: Optional[str] = None

# ----------------- Maintenance Assignment Schemas -----------------
class AssignmentCreate(BaseModel):
    assigned_to_id: int
    notes: Optional[str] = None
    priority_level: Optional[str] = "MEDIUM"
    target_completion_date: Optional[datetime] = None

class AssignmentResponse(BaseModel):
    id: int
    report_id: int
    assigned_by_id: int
    assigned_by_name: Optional[str] = None
    assigned_to_id: int
    assigned_to_name: Optional[str] = None
    notes: Optional[str] = None
    priority_level: str
    assignment_status: str
    target_completion_date: Optional[datetime] = None
    assigned_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Report Schemas -----------------
class ReportCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address_text: Optional[str] = None
    road_classification: Optional[str] = "LOCAL"

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    road_classification: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    reference_number: str
    reporter_id: Optional[int] = None
    reporter_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    image_path: str
    annotated_image_path: Optional[str] = None
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    area_locality: Optional[str] = "Nagpur Central"
    city: Optional[str] = "Nagpur"
    road_classification: str
    incident_date: Optional[datetime] = None
    external_submission_status: Optional[str] = "NOT_REGISTERED"
    external_reference_id: Optional[str] = None
    external_reference_notes: Optional[str] = None
    external_reference_recorded_at: Optional[datetime] = None
    road_jurisdiction: Optional[str] = "NMC"
    ward_name: Optional[str] = "Dharampeth"
    sla_deadline_at: Optional[datetime] = None
    is_sla_breached: bool = False
    reopened_count: int = 0
    estimated_surface_area_sqm: float = 0.0
    external_submission_label: Optional[str] = "Not yet registered through NMC"
    internal_status_label: Optional[str] = "Saved within CivicLens AI"
    official_portal_url: Optional[str] = "https://nmcnagpur.gov.in/grievance/complaint_form.php"
    pwd_toll_free_number: Optional[str] = "1800 233 0080"
    pwd_portal_url: Optional[str] = "https://pwd.maharashtra.gov.in/en/toll-free-numbers-for-registering-pothole-complaints-on-pwd-roads/"
    predicted_damage_category: str
    prediction_confidence: float
    severity_score: float
    severity_level: str
    priority_score: float
    workflow_status: str
    assigned_authority_id: Optional[int] = None
    assigned_authority_name: Optional[str] = None
    duplicate_reference_id: Optional[int] = None
    is_duplicate: bool
    duplicate_confidence: float
    is_demo_data: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublicTrackResponse(BaseModel):
    id: int
    reference_number: str
    title: str
    description: Optional[str] = None
    image_path: str
    annotated_image_path: Optional[str] = None
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    area_locality: Optional[str] = "Nagpur Central"
    city: Optional[str] = "Nagpur"
    road_classification: str
    predicted_damage_category: str
    prediction_confidence: float
    severity_score: float
    severity_level: str
    priority_score: float
    workflow_status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    resolution_image_path: Optional[str] = None
    status_history: List[StatusHistoryResponse] = []
    analyses: List[AIAnalysisResponse] = []
    verification_stages: List[Any] = []
    repair_evidences: List[Any] = []
    ward_name: Optional[str] = "Dharampeth"
    sla_deadline_at: Optional[datetime] = None
    is_sla_breached: bool = False
    reopened_count: int = 0
    estimated_surface_area_sqm: float = 0.0
    external_reference_id: Optional[str] = None
    external_reference_notes: Optional[str] = None
    external_reference_recorded_at: Optional[datetime] = None
    road_jurisdiction: Optional[str] = "NMC"
    external_submission_status: str = "NOT_REGISTERED"
    external_submission_label: str = "Not yet registered through NMC"
    internal_status_label: str = "Saved within CivicLens AI"
    official_portal_url: str = "https://nmcnagpur.gov.in/grievance/complaint_form.php"
    pwd_toll_free_number: str = "1800 233 0080"
    pwd_portal_url: str = "https://pwd.maharashtra.gov.in/en/toll-free-numbers-for-registering-pothole-complaints-on-pwd-roads/"
    external_submission_notice: str = (
        "Demonstration & handoff environment: This report is recorded in CivicLens AI for review within this application. "
        "Official submission to Nagpur Municipal Corporation requires continuing to the official portal at "
        "https://nmcnagpur.gov.in/grievance/complaint_form.php and completing mobile OTP verification."
    )

    model_config = ConfigDict(from_attributes=True)

class ExternalReferenceRequest(BaseModel):
    external_reference_id: str
    notes: Optional[str] = None
    road_jurisdiction: Optional[str] = "NMC"

class QuickInspectResponse(BaseModel):
    predicted_damage_category: str
    prediction_confidence: float
    severity_score: float
    severity_level: str
    severity_breakdown: Dict[str, Any]
    bounding_boxes: List[Dict[str, Any]]
    annotated_image_path: str
    inference_duration_ms: float
    inference_mode: str
    model_identifier: str
    is_demo_result: bool
    disclaimer: str
    is_road_scene: bool = True
    road_scene_status: str = "VERIFIED"
    road_scene_message: str = "Road pavement scene successfully verified."
    quality_status: str = "PASSED"
    quality_message: str = "Photograph clarity and lighting verified."
    detected_pothole_count: int = 0
    potholes_breakdown: List[Dict[str, Any]] = []
    estimated_surface_area_sqm: float = 0.0

class ReportDetailResponse(ReportResponse):
    analyses: List[AIAnalysisResponse] = []
    assignments: List[AssignmentResponse] = []
    status_history: List[StatusHistoryResponse] = []
    verification_stages: List[Any] = []
    repair_evidences: List[Any] = []
    resolution_notes: Optional[str] = None
    resolution_image_path: Optional[str] = None
    resolved_at: Optional[datetime] = None
    priority_breakdown: Optional[Dict[str, Any]] = None
    duplicate_candidates: Optional[List[Dict[str, Any]]] = None

# ----------------- Map Marker Schema -----------------
class MapReportMarker(BaseModel):
    id: int
    reference_number: str
    title: str
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    predicted_damage_category: str
    severity_score: float
    severity_level: str
    priority_score: float
    workflow_status: str
    image_path: str
    created_at: datetime

# ----------------- Analytics Schemas -----------------
class OverviewStats(BaseModel):
    total_reports: int
    pending_review: int
    assigned_count: int
    in_progress_count: int
    resolved_count: int
    rejected_count: int
    critical_severity_count: int
    average_resolution_hours: float
    ai_inference_mode: str
    ai_model_name: str

class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: float

class SeverityStat(BaseModel):
    level: str
    count: int
    color: str

class HotspotArea(BaseModel):
    area_name: str
    report_count: int
    average_severity: float
    latitude: float
    longitude: float

class MonthlyTrend(BaseModel):
    month: str
    submitted: int
    resolved: int

class AnalyticsTrends(BaseModel):
    categories: List[CategoryStat]
    severities: List[SeverityStat]
    hotspots: List[HotspotArea]
    monthly_trends: List[MonthlyTrend]
    priority_distribution: List[Dict[str, Any]]

# ----------------- Audit Log Schemas -----------------
class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    target_type: str
    target_id: str
    metadata_json: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Verification & Resolution Schemas -----------------
class ReportVerificationStageResponse(BaseModel):
    id: int
    report_id: int
    stage_number: int
    stage_key: str
    stage_title: str
    status: str
    confidence_score: float
    summary: str
    evidence_json: Optional[str] = None
    failure_reason: Optional[str] = None
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RepairResolutionEvidenceResponse(BaseModel):
    id: int
    report_id: int
    assignment_id: Optional[int] = None
    before_image_path: str
    after_image_path: str
    residual_damage_score: float
    resolution_status: str
    ai_confidence: float
    inspection_notes: Optional[str] = None
    contractor_name: Optional[str] = None
    asphalt_mix_type: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NagpurWardResponse(BaseModel):
    id: int
    zone_number: int
    ward_name: str
    marathi_name: Optional[str] = None
    office_address: Optional[str] = None
    zonal_officer_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    latitude: float
    longitude: float
    boundary_coordinates_json: Optional[str] = None
    active_defects_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class NMCIntegrationConfigResponse(BaseModel):
    id: int
    adapter_mode: str
    endpoint_url: str
    api_key_masked: Optional[str] = None
    mou_reference: str
    timeout_seconds: int
    retry_limit: int
    is_healthy: bool
    last_ping_ms: float
    last_heartbeat_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NMCIntegrationConfigUpdate(BaseModel):
    adapter_mode: Optional[str] = None
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    timeout_seconds: Optional[int] = None
    retry_limit: Optional[int] = None


class NMCTransactionAuditResponse(BaseModel):
    id: int
    report_id: int
    idempotency_key: str
    transaction_type: str
    external_status: str
    official_reference_id: Optional[str] = None
    request_payload_json: Optional[str] = None
    response_payload_json: Optional[str] = None
    http_status_code: int
    retry_count: int
    notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintReopenCreate(BaseModel):
    reopen_reason: str = Field(..., min_length=10, max_length=500)
    evidence_image_path: Optional[str] = None


class ComplaintReopenResponse(BaseModel):
    id: int
    report_id: int
    citizen_id: int
    reopen_reason: str
    new_evidence_image_path: Optional[str] = None
    status: str
    officer_review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NLParseRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=1000)


class NLParseResponse(BaseModel):
    parsed_successfully: bool
    structured_title: Optional[str] = None
    suggested_title: Optional[str] = None
    predicted_damage_category: Optional[str] = None
    distress_type: Optional[str] = None
    category_confidence: Optional[float] = None
    severity_level: Optional[str] = None
    suggested_severity: Optional[str] = None
    estimated_severity_score: Optional[float] = None
    road_classification: Optional[str] = None
    suggested_ward: Optional[str] = None
    ward_name: Optional[str] = None
    extracted_landmark: Optional[str] = None
    landmark: Optional[str] = None
    summary: Optional[str] = None
    urgency_level: Optional[str] = None
    extracted_from_input: Optional[str] = None
    message: Optional[str] = None


class RepairVerificationRequest(BaseModel):
    after_image_path: str
    contractor_name: Optional[str] = None
    asphalt_mix_type: Optional[str] = "Hot Mix Asphalt (Bituminous Concrete)"
    inspection_notes: Optional[str] = None

