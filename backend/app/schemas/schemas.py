from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "citizen"  # "citizen", "authority", "admin"

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
    external_submission_status: Optional[str] = "DEMO_ENVIRONMENT"
    external_reference_id: Optional[str] = None
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
    external_submission_status: str = "DEMO_ENVIRONMENT"
    external_submission_notice: str = (
        "Demonstration environment: This report is recorded in CivicLens AI for review within this application. "
        "Official submission to Nagpur Municipal Corporation is not enabled or confirmed."
    )

    model_config = ConfigDict(from_attributes=True)

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

class ReportDetailResponse(ReportResponse):
    analyses: List[AIAnalysisResponse] = []
    assignments: List[AssignmentResponse] = []
    status_history: List[StatusHistoryResponse] = []
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
