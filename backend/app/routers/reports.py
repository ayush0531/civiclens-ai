import os
import json
import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.models import (
    RoadDamageReport, AIAnalysis, StatusHistory, AuditLog, User,
    ReportVerificationStage, RepairResolutionEvidence, ComplaintReopenRequest, NagpurWard
)
from backend.app.schemas.schemas import (
    ReportResponse, ReportDetailResponse, ReportUpdate, AIAnalysisResponse,
    AssignmentResponse, StatusHistoryResponse, PublicTrackResponse, ExternalReferenceRequest,
    ReportVerificationStageResponse, RepairResolutionEvidenceResponse,
    ComplaintReopenCreate, ComplaintReopenResponse, RepairVerificationRequest
)
from backend.app.services.auth_service import (
    get_current_user, get_current_user_optional, require_roles
)
from backend.app.services.ai_service import ai_service
from backend.app.services.duplicate_service import duplicate_service
from backend.app.services.priority_service import priority_engine
from backend.app.services.verification_service import verification_service
from backend.app.services.nmc_adapter import nmc_manager
from backend.app.services.repair_verification_service import repair_verification_service
from backend.app.services.nmc_service import (
    nmc_service, NMCIntegrationService, OFFICIAL_STATUS_LABELS, CIVICLENS_INTERNAL_STATUS_LABELS
)
from backend.app.utils.file_storage import save_upload_image

router = APIRouter(prefix="/reports", tags=["Road Damage Reports"])

def generate_reference_number(db: Session) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(RoadDamageReport).count() + 1
    return f"CVL-{year}-{count:04d}"

@router.get("", response_model=List[ReportResponse])
def get_reports(
    category: Optional[str] = Query(None),
    severity_level: Optional[str] = Query(None),
    workflow_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_duplicate: Optional[bool] = Query(None),
    my_reports_only: bool = Query(False),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(RoadDamageReport)

    if my_reports_only and current_user:
        query = query.filter(RoadDamageReport.reporter_id == current_user.id)

    if category:
        query = query.filter(RoadDamageReport.predicted_damage_category.ilike(f"%{category}%"))

    if severity_level:
        query = query.filter(RoadDamageReport.severity_level == severity_level.upper())

    if workflow_status:
        query = query.filter(RoadDamageReport.workflow_status == workflow_status.upper())

    if is_duplicate is not None:
        query = query.filter(RoadDamageReport.is_duplicate == is_duplicate)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RoadDamageReport.title.ilike(search_fmt),
                RoadDamageReport.reference_number.ilike(search_fmt),
                RoadDamageReport.address_text.ilike(search_fmt)
            )
        )

    # Sorting
    sort_col = getattr(RoadDamageReport, sort_by, RoadDamageReport.created_at)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * limit
    reports = query.offset(offset).limit(limit).all()

    # Hydrate reporter and assigned names
    results = []
    for r in reports:
        rep_dict = ReportResponse.model_validate(r)
        if r.reporter:
            rep_dict.reporter_name = r.reporter.name
        if r.assigned_authority:
            rep_dict.assigned_authority_name = r.assigned_authority.name
        results.append(rep_dict)

    return results


@router.post("", response_model=ReportDetailResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    title: str = Form(..., min_length=5, max_length=150),
    latitude: float = Form(..., ge=-90.0, le=90.0),
    longitude: float = Form(..., ge=-180.0, le=180.0),
    description: Optional[str] = Form(None),
    address_text: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    area_locality: Optional[str] = Form("Nagpur Central"),
    city: Optional[str] = Form("Nagpur"),
    road_classification: Optional[str] = Form("LOCAL"),
    road_jurisdiction: Optional[str] = Form("NMC"),
    reporter_name: Optional[str] = Form(None),
    reporter_contact: Optional[str] = Form(None),
    incident_date: Optional[str] = Form(None),
    auto_analyze: bool = Form(True),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Store image safely
    image_rel_path = save_upload_image(image)
    image_abs_path = os.path.join(settings.BASE_DIR, image_rel_path.lstrip("/"))

    ref_no = generate_reference_number(db)
    reporter_id = current_user.id if current_user else None

    # Parse optional incident date
    parsed_date = None
    if incident_date:
        try:
            parsed_date = datetime.datetime.fromisoformat(incident_date)
        except Exception:
            parsed_date = datetime.datetime.utcnow()

    # Initial report record
    report = RoadDamageReport(
        reference_number=ref_no,
        reporter_id=reporter_id,
        title=title.strip(),
        description=description.strip() if description else None,
        image_path=image_rel_path,
        latitude=latitude,
        longitude=longitude,
        address_text=address_text.strip() if address_text else None,
        landmark=landmark.strip() if landmark else None,
        area_locality=area_locality.strip() if area_locality else "Nagpur Central",
        city=city.strip() if city else "Nagpur",
        road_classification=(road_classification or "LOCAL").upper(),
        road_jurisdiction=(road_jurisdiction or "NMC").upper(),
        reporter_name=reporter_name.strip() if reporter_name else (current_user.name if current_user else None),
        reporter_contact=reporter_contact.strip() if reporter_contact else (current_user.email if current_user else None),
        incident_date=parsed_date or datetime.datetime.utcnow(),
        external_submission_status="NOT_REGISTERED",
        workflow_status="SUBMITTED",
        is_demo_data=False
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Initial Status History
    # Anonymous reports have no user foreign key. Do not fabricate user ID 1.
    if reporter_id is not None:
        status_entry = StatusHistory(
            report_id=report.id,
            previous_status="NONE",
            new_status="SUBMITTED",
            changed_by_id=reporter_id,
            notes="Citizen submitted damage report."
        )
        db.add(status_entry)

    # Execute 5-Stage Verification Engine
    if auto_analyze:
        try:
            annotated_filename = f"{uuid.uuid4().hex}_annotated.jpg"
            annotated_abs_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)
            annotated_rel_path = f"/uploads/{annotated_filename}"

            stages = verification_service.run_full_pipeline(
                db=db,
                report=report,
                image_abs_path=image_abs_path,
                annotated_abs_path=annotated_abs_path
            )

            # Populate AIAnalysis record for backward-compatible queries
            stg2 = next((s for s in stages if s.stage_number == 2), None)
            if stg2 and stg2.evidence_json:
                ev2 = json.loads(stg2.evidence_json)
                analysis_rec = AIAnalysis(
                    report_id=report.id,
                    model_identifier=ev2.get("model_identifier", "CivicLens-YOLOv8-RDD2022 (ONNX)"),
                    model_version="2.0.0",
                    inference_mode=ev2.get("engine_mode", "ONNX"),
                    predicted_classes=json.dumps([ev2.get("primary_class", report.predicted_damage_category)]),
                    confidence_scores=json.dumps([ev2.get("detection_confidence", report.prediction_confidence)]),
                    bounding_boxes=json.dumps(ev2.get("bounding_boxes", [])),
                    severity_breakdown=json.dumps({"severity_score": report.severity_score, "level": report.severity_level}),
                    analysis_metadata=json.dumps({"latency_ms": ev2.get("inference_duration_ms", 35.0)}),
                    inference_duration_ms=ev2.get("inference_duration_ms", 35.0),
                    is_demo_result=False,
                    disclaimer="Validated 5-stage civic infrastructure audit."
                )
                db.add(analysis_rec)
        except Exception as e:
            print(f"[CivicLens AI] Verification pipeline error: {e}")
            report.predicted_damage_category = "Other / uncertain"
            report.prediction_confidence = 0.50
            report.severity_level = "PENDING"

    # Audit Log
    audit = AuditLog(
        actor_id=reporter_id,
        action="REPORT_CREATE",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"ref": "{ref_no}", "lat": {latitude}, "lon": {longitude}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(report)

    return get_report_detail(report.id, db)


@router.get("/track/{identifier}", response_model=PublicTrackResponse)
def track_report_public(identifier: str, db: Session = Depends(get_db)):
    """
    Public Citizen Complaint Tracking Endpoint.
    Accepts:
    1. CivicLens AI Reference Number (e.g., CVL-2026-0001)
    2. Database Numeric ID (e.g. 1)
    3. Official NMC Complaint Reference (e.g., NMC-2026-XXXX)
    """
    clean_id = identifier.strip()
    report = db.query(RoadDamageReport).filter(
        RoadDamageReport.reference_number.ilike(clean_id)
    ).first()

    if not report and clean_id.isdigit():
        report = db.query(RoadDamageReport).filter(
            RoadDamageReport.id == int(clean_id)
        ).first()

    if not report:
        report = db.query(RoadDamageReport).filter(
            RoadDamageReport.external_reference_id.ilike(clean_id)
        ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint reference '{clean_id}' was not found in the CivicLens AI system. Please verify your complaint ID or official reference."
        )

    # Format public status history
    history_resp = []
    for sh in report.status_history:
        history_resp.append(StatusHistoryResponse(
            id=sh.id,
            report_id=sh.report_id,
            previous_status=sh.previous_status,
            new_status=sh.new_status,
            changed_by_name="Municipal Authority" if (sh.changed_by and sh.changed_by.role != "citizen") else "Citizen Reporter",
            changed_by_role=sh.changed_by.role if sh.changed_by else "system",
            notes=sh.notes,
            timestamp=sh.timestamp
        ))

    # Format public AI analysis summary
    analyses_resp = []
    for a in report.analyses:
        analyses_resp.append(AIAnalysisResponse(
            id=a.id,
            report_id=a.report_id,
            model_identifier=a.model_identifier,
            model_version=a.model_version,
            inference_mode=a.inference_mode,
            predicted_classes=json.loads(a.predicted_classes) if a.predicted_classes else [],
            confidence_scores=json.loads(a.confidence_scores) if a.confidence_scores else [],
            bounding_boxes=json.loads(a.bounding_boxes) if a.bounding_boxes else [],
            severity_breakdown=json.loads(a.severity_breakdown) if a.severity_breakdown else {},
            analysis_metadata={},
            inference_duration_ms=a.inference_duration_ms,
            is_demo_result=a.is_demo_result,
            disclaimer=a.disclaimer,
            created_at=a.created_at
        ))

    # Format 5-Stage Verification Stages
    stages_resp = []
    for s in report.verification_stages:
        stages_resp.append(ReportVerificationStageResponse(
            id=s.id,
            report_id=s.report_id,
            stage_number=s.stage_number,
            stage_key=s.stage_key,
            stage_title=s.stage_title,
            status=s.status,
            confidence_score=s.confidence_score,
            summary=s.summary,
            evidence_json=s.evidence_json,
            failure_reason=s.failure_reason,
            executed_at=s.executed_at
        ))

    # Format Repair Evidences
    repair_resp = []
    for re_item in report.repair_evidences:
        repair_resp.append(RepairResolutionEvidenceResponse(
            id=re_item.id,
            report_id=re_item.report_id,
            assignment_id=re_item.assignment_id,
            before_image_path=re_item.before_image_path,
            after_image_path=re_item.after_image_path,
            residual_damage_score=re_item.residual_damage_score,
            resolution_status=re_item.resolution_status,
            ai_confidence=re_item.ai_confidence,
            inspection_notes=re_item.inspection_notes,
            contractor_name=re_item.contractor_name,
            asphalt_mix_type=re_item.asphalt_mix_type,
            created_at=re_item.created_at
        ))

    ext_status = report.external_submission_status or "NOT_REGISTERED"
    ext_label = OFFICIAL_STATUS_LABELS.get(ext_status, "Not yet registered through NMC")
    int_label = CIVICLENS_INTERNAL_STATUS_LABELS.get(report.workflow_status, "Saved within CivicLens AI")

    is_breached = bool(report.sla_deadline_at and datetime.datetime.utcnow() > report.sla_deadline_at and report.workflow_status not in ["RESOLVED", "REJECTED"])

    return PublicTrackResponse(
        id=report.id,
        reference_number=report.reference_number,
        title=report.title,
        description=report.description,
        image_path=report.image_path,
        annotated_image_path=report.annotated_image_path,
        latitude=report.latitude,
        longitude=report.longitude,
        address_text=report.address_text,
        landmark=report.landmark,
        area_locality=report.area_locality or "Nagpur Central",
        city=report.city or "Nagpur",
        road_classification=report.road_classification,
        predicted_damage_category=report.predicted_damage_category,
        prediction_confidence=report.prediction_confidence,
        severity_score=report.severity_score,
        severity_level=report.severity_level,
        priority_score=report.priority_score,
        workflow_status=report.workflow_status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        resolved_at=report.resolved_at,
        resolution_notes=report.resolution_notes,
        resolution_image_path=report.resolution_image_path,
        status_history=history_resp,
        analyses=analyses_resp,
        verification_stages=stages_resp,
        repair_evidences=repair_resp,
        ward_name=report.ward_name or report.area_locality or "Dharampeth",
        sla_deadline_at=report.sla_deadline_at,
        is_sla_breached=is_breached,
        reopened_count=report.reopened_count or 0,
        estimated_surface_area_sqm=report.estimated_surface_area_sqm or 0.0,
        external_reference_id=report.external_reference_id,
        external_reference_notes=report.external_reference_notes,
        external_reference_recorded_at=report.external_reference_recorded_at,
        road_jurisdiction=report.road_jurisdiction or "NMC",
        external_submission_status=ext_status,
        external_submission_label=ext_label,
        internal_status_label=int_label,
        official_portal_url=nmc_service.get_official_portal_url(),
        pwd_toll_free_number=nmc_service.get_pwd_helpline()["toll_free_number"],
        pwd_portal_url=nmc_service.get_pwd_helpline()["official_url"],
        external_submission_notice=(
            "Official registration notice: CivicLens AI prepares your road-defect telemetry. "
            "To lodge an official civic complaint with Nagpur Municipal Corporation, continue to "
            "the official portal at https://nmcnagpur.gov.in/grievance/complaint_form.php and complete mobile OTP verification."
        )
    )


@router.post("/{id}/external-reference", response_model=ReportDetailResponse)
def record_external_reference(
    id: int,
    payload: ExternalReferenceRequest,
    db: Session = Depends(get_db)
):
    """
    Records an official NMC complaint reference number entered by the citizen.
    Links the official government reference with the CivicLens AI record while
    truthfully marking the official state as 'Registration reported by citizen — unverified'.
    """
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )

    ref_clean = payload.external_reference_id.strip()
    if not ref_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Official reference ID cannot be empty.")

    prev_wf = report.workflow_status
    report.external_reference_id = ref_clean
    report.external_submission_status = "CITIZEN_REPORTED_UNVERIFIED"
    report.external_reference_notes = payload.notes.strip() if payload.notes else None
    report.external_reference_recorded_at = datetime.datetime.utcnow()
    if payload.road_jurisdiction:
        report.road_jurisdiction = payload.road_jurisdiction.strip().upper()

    if report.workflow_status in ["SAVED", "SUBMITTED", "AWAITING_OFFICIAL_REGISTRATION"]:
        report.workflow_status = "OFFICIAL_REFERENCE_RECORDED"

    # Status History entry. Anonymous reports must not reference a fabricated user.
    if report.reporter_id is not None:
        status_entry = StatusHistory(
            report_id=report.id,
            previous_status=prev_wf,
            new_status=report.workflow_status,
            changed_by_id=report.reporter_id,
            notes=f"Citizen recorded official complaint reference: {ref_clean} (Status: Registration reported by citizen — unverified)"
        )
        db.add(status_entry)

    # Audit Log
    audit = AuditLog(
        actor_id=report.reporter_id,
        action="EXTERNAL_REFERENCE_RECORDED",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"external_ref": "{ref_clean}", "status": "CITIZEN_REPORTED_UNVERIFIED"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(report)

    return get_report_detail(report.id, db)


@router.get("/{id}/summary-text", response_class=PlainTextResponse)
def get_complaint_summary_text(id: int, db: Session = Depends(get_db)):
    """
    Returns a structured, formatted plain text summary of the complaint
    for easy copying, sharing, or downloading without third-party dependencies.
    """
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    summary_str = nmc_service.format_complaint_summary(report)
    return PlainTextResponse(content=summary_str, media_type="text/plain; charset=utf-8")


@router.get("/nmc/integration-spec")
def get_nmc_integration_spec():
    """
    Returns the real-world NMC integration boundary status, official links,
    and requirements for a direct API connection.
    """
    return nmc_service.get_authorized_integration_spec()



@router.get("/{id}", response_model=ReportDetailResponse)
def get_report_detail(id: int, db: Session = Depends(get_db)):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road damage report with ID {id} not found."
        )

    # Format AI analyses
    analyses_resp = []
    for a in report.analyses:
        analyses_resp.append(AIAnalysisResponse(
            id=a.id,
            report_id=a.report_id,
            model_identifier=a.model_identifier,
            model_version=a.model_version,
            inference_mode=a.inference_mode,
            predicted_classes=json.loads(a.predicted_classes) if a.predicted_classes else [],
            confidence_scores=json.loads(a.confidence_scores) if a.confidence_scores else [],
            bounding_boxes=json.loads(a.bounding_boxes) if a.bounding_boxes else [],
            severity_breakdown=json.loads(a.severity_breakdown) if a.severity_breakdown else {},
            analysis_metadata=json.loads(a.analysis_metadata) if a.analysis_metadata else {},
            inference_duration_ms=a.inference_duration_ms,
            is_demo_result=a.is_demo_result,
            disclaimer=a.disclaimer,
            created_at=a.created_at
        ))

    # Format assignments
    assignments_resp = []
    for asgn in report.assignments:
        assignments_resp.append(AssignmentResponse(
            id=asgn.id,
            report_id=asgn.report_id,
            assigned_by_id=asgn.assigned_by_id,
            assigned_by_name=asgn.assigned_by.name if asgn.assigned_by else None,
            assigned_to_id=asgn.assigned_to_id,
            assigned_to_name=asgn.assigned_to.name if asgn.assigned_to else None,
            notes=asgn.notes,
            priority_level=asgn.priority_level,
            assignment_status=asgn.assignment_status,
            target_completion_date=asgn.target_completion_date,
            assigned_at=asgn.assigned_at,
            completed_at=asgn.completed_at
        ))

    # Format status history
    history_resp = []
    for sh in report.status_history:
        history_resp.append(StatusHistoryResponse(
            id=sh.id,
            report_id=sh.report_id,
            previous_status=sh.previous_status,
            new_status=sh.new_status,
            changed_by_name=sh.changed_by.name if sh.changed_by else "System",
            changed_by_role=sh.changed_by.role if sh.changed_by else "system",
            notes=sh.notes,
            timestamp=sh.timestamp
        ))

    # Format 5-Stage Verification Stages
    stages_resp = []
    for s in report.verification_stages:
        stages_resp.append(ReportVerificationStageResponse(
            id=s.id,
            report_id=s.report_id,
            stage_number=s.stage_number,
            stage_key=s.stage_key,
            stage_title=s.stage_title,
            status=s.status,
            confidence_score=s.confidence_score,
            summary=s.summary,
            evidence_json=s.evidence_json,
            failure_reason=s.failure_reason,
            executed_at=s.executed_at
        ))

    # Format Repair Evidences
    repair_resp = []
    for re_item in report.repair_evidences:
        repair_resp.append(RepairResolutionEvidenceResponse(
            id=re_item.id,
            report_id=re_item.report_id,
            assignment_id=re_item.assignment_id,
            before_image_path=re_item.before_image_path,
            after_image_path=re_item.after_image_path,
            residual_damage_score=re_item.residual_damage_score,
            resolution_status=re_item.resolution_status,
            ai_confidence=re_item.ai_confidence,
            inspection_notes=re_item.inspection_notes,
            contractor_name=re_item.contractor_name,
            asphalt_mix_type=re_item.asphalt_mix_type,
            created_at=re_item.created_at
        ))

    # Calculate duplicate candidates
    image_abs_path = os.path.join(settings.BASE_DIR, report.image_path.lstrip("/")) if report.image_path else None
    dup_candidates = duplicate_service.find_potential_duplicates(
        db=db,
        latitude=report.latitude,
        longitude=report.longitude,
        current_report_id=report.id,
        image_path=image_abs_path
    )

    # Priority breakdown
    priority_calc = priority_engine.calculate_priority(
        severity_score=report.severity_score,
        confidence=report.prediction_confidence,
        duplicate_count=len(dup_candidates),
        created_at=report.created_at,
        road_classification=report.road_classification
    )

    is_breached = bool(report.sla_deadline_at and datetime.datetime.utcnow() > report.sla_deadline_at and report.workflow_status not in ["RESOLVED", "REJECTED"])

    resp = ReportDetailResponse(
        id=report.id,
        reference_number=report.reference_number,
        reporter_id=report.reporter_id,
        reporter_name=report.reporter.name if report.reporter else "Anonymous Citizen",
        title=report.title,
        description=report.description,
        image_path=report.image_path,
        annotated_image_path=report.annotated_image_path,
        latitude=report.latitude,
        longitude=report.longitude,
        address_text=report.address_text,
        landmark=report.landmark,
        area_locality=report.area_locality or "Nagpur Central",
        city=report.city or "Nagpur",
        road_classification=report.road_classification,
        incident_date=report.incident_date,
        ward_name=report.ward_name or report.area_locality or "Dharampeth",
        sla_deadline_at=report.sla_deadline_at,
        is_sla_breached=is_breached,
        reopened_count=report.reopened_count or 0,
        estimated_surface_area_sqm=report.estimated_surface_area_sqm or 0.0,
        external_submission_status=report.external_submission_status or "NOT_REGISTERED",
        external_reference_id=report.external_reference_id,
        external_reference_notes=report.external_reference_notes,
        external_reference_recorded_at=report.external_reference_recorded_at,
        road_jurisdiction=report.road_jurisdiction or "NMC",
        external_submission_label=NMCIntegrationService.OFFICIAL_STATUS_LABELS.get(
            report.external_submission_status or "NOT_REGISTERED",
            report.external_submission_status
        ),
        internal_status_label=NMCIntegrationService.INTERNAL_STATUS_LABELS.get(
            report.workflow_status,
            report.workflow_status
        ),
        official_portal_url=NMCIntegrationService.OFFICIAL_PORTAL_URL,
        pwd_toll_free_number=NMCIntegrationService.PWD_TOLL_FREE_NUMBER,
        pwd_portal_url=NMCIntegrationService.PWD_OFFICIAL_URL,
        predicted_damage_category=report.predicted_damage_category,
        prediction_confidence=report.prediction_confidence,
        severity_score=report.severity_score,
        severity_level=report.severity_level,
        priority_score=report.priority_score,
        workflow_status=report.workflow_status,
        assigned_authority_id=report.assigned_authority_id,
        assigned_authority_name=report.assigned_authority.name if report.assigned_authority else None,
        duplicate_reference_id=report.duplicate_reference_id,
        is_duplicate=report.is_duplicate,
        duplicate_confidence=report.duplicate_confidence,
        resolution_notes=report.resolution_notes,
        resolution_image_path=report.resolution_image_path,
        resolved_at=report.resolved_at,
        is_demo_data=report.is_demo_data,
        created_at=report.created_at,
        updated_at=report.updated_at,
        analyses=analyses_resp,
        assignments=assignments_resp,
        status_history=history_resp,
        verification_stages=stages_resp,
        repair_evidences=repair_resp,
        priority_breakdown=priority_calc,
        duplicate_candidates=dup_candidates[:5]
    )
    return resp


@router.patch("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_in: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Only reporter or authority/admin can update report metadata
    if current_user.role == "citizen" and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this report")

    if report_in.title is not None:
        report.title = report_in.title.strip()
    if report_in.description is not None:
        report.description = report_in.description.strip()
    if report_in.road_classification is not None:
        report.road_classification = report_in.road_classification.upper()

    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.post("/{id}/link-duplicate", response_model=ReportDetailResponse)
def link_duplicate_report(
    id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["authority", "admin"]))
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Source report not found")

    target_id = payload.get("target_report_id")
    if not target_id:
        raise HTTPException(status_code=400, detail="target_report_id is required")

    target = db.query(RoadDamageReport).filter(RoadDamageReport.id == int(target_id)).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target duplicate report not found")

    report.is_duplicate = True
    report.duplicate_reference_id = target.id
    report.duplicate_confidence = 0.95

    # Log audit
    audit = AuditLog(
        actor_id=current_user.id,
        action="REPORT_LINK_DUPLICATE",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"linked_to": "{target.reference_number}"}}'
    )
    db.add(audit)
    db.commit()

    return get_report_detail(report.id, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    audit = AuditLog(
        actor_id=current_user.id,
        action="REPORT_DELETE",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"ref": "{report.reference_number}"}}'
    )
    db.add(audit)
    db.delete(report)
    db.commit()
    return None


@router.post("/{id}/submit-nmc", response_model=ReportDetailResponse)
def submit_complaint_to_nmc(
    id: int,
    idempotency_key: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Triggers the Nagpur Municipal Corporation (NMC) Integration Service.
    Dispatches complaint payload through active adapter (Simulated Demonstration or Live API).
    """
    res = nmc_manager.submit_report_to_nmc(
        db=db,
        report_id=id,
        idempotency_key=idempotency_key,
        custom_notes=notes
    )
    return get_report_detail(id, db)


@router.post("/{id}/verify-repair")
def verify_repair_resolution(
    id: int,
    after_image: Optional[UploadFile] = File(None),
    after_image_path: Optional[str] = Form(None),
    contractor_name: Optional[str] = Form("NMC Road Works Wing"),
    asphalt_mix_type: Optional[str] = Form("Hot Mix Asphalt (Bituminous Concrete)"),
    inspection_notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["authority", "admin"]))
):
    """
    Municipal Officer Repair Resolution Inspection.
    Runs automated before-and-after computer vision verification on the post-repair patch.
    Calculates residual damage index and updates complaint status.
    """
    rel_path = after_image_path
    if after_image:
        rel_path = save_upload_image(after_image)

    if not rel_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either an uploaded 'after_image' file or an existing 'after_image_path' string is required."
        )

    result = repair_verification_service.verify_repair(
        db=db,
        report_id=id,
        after_image_rel_path=rel_path,
        officer_id=current_user.id,
        contractor_name=contractor_name,
        asphalt_mix_type=asphalt_mix_type,
        inspection_notes=inspection_notes
    )
    return result


@router.post("/{id}/reopen", response_model=ReportDetailResponse)
def reopen_complaint(
    id: int,
    reason: str = Form(..., min_length=10, max_length=500),
    evidence_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Citizen Reopen Workflow.
    Allows citizens to dispute incomplete or substandard repairs by submitting
    photographic evidence and reopening the municipal complaint.
    """
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    evidence_rel_path = None
    if evidence_image:
        evidence_rel_path = save_upload_image(evidence_image)

    actor_id = current_user.id if current_user else (report.reporter_id or 1)

    reopen_req = ComplaintReopenRequest(
        report_id=report.id,
        citizen_id=actor_id,
        reopen_reason=reason.strip(),
        new_evidence_image_path=evidence_rel_path,
        status="APPROVED",
        officer_review_notes="Citizen reported defect re-occurrence / incomplete patch.",
        created_at=datetime.datetime.utcnow(),
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(reopen_req)

    prev_status = report.workflow_status
    report.workflow_status = "IN_PROGRESS"
    report.reopened_count = (report.reopened_count or 0) + 1
    report.resolved_at = None

    hist = StatusHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status="IN_PROGRESS",
        changed_by_id=actor_id,
        notes=f"Complaint Reopened by citizen. Reason: {reason.strip()[:100]}",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(hist)

    audit = AuditLog(
        actor_id=actor_id,
        action="COMPLAINT_REOPEN",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"reason": "{reason.strip()[:60]}", "reopened_count": {report.reopened_count}}}',
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(report)

    return get_report_detail(report.id, db)

