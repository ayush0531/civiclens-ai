import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import (
    RoadDamageReport, MaintenanceAssignment, StatusHistory, AuditLog, User
)
from backend.app.schemas.schemas import (
    AssignmentCreate, AssignmentResponse, StatusTransitionRequest, ReportDetailResponse
)
from backend.app.services.auth_service import require_roles, get_current_user
from backend.app.utils.file_storage import save_upload_image
from backend.app.routers.reports import get_report_detail

router = APIRouter(prefix="/reports", tags=["Maintenance Workflow & Assignments"])

VALID_TRANSITIONS = {
    "SUBMITTED": ["UNDER_REVIEW", "ACTION_PLANNED", "ASSIGNED", "REJECTED", "AWAITING_OFFICIAL_REGISTRATION", "OFFICIAL_REFERENCE_RECORDED"],
    "SAVED": ["AWAITING_OFFICIAL_REGISTRATION", "OFFICIAL_REFERENCE_RECORDED", "UNDER_REVIEW", "ACTION_PLANNED", "REJECTED"],
    "AWAITING_OFFICIAL_REGISTRATION": ["OFFICIAL_REFERENCE_RECORDED", "UNDER_REVIEW", "REJECTED"],
    "OFFICIAL_REFERENCE_RECORDED": ["UNDER_REVIEW", "ACTION_PLANNED", "ASSIGNED", "MONITORING", "REJECTED"],
    "MONITORING": ["RESOLVED", "CLOSED_INTERNAL", "UNDER_REVIEW"],
    "UNDER_REVIEW": ["ACTION_PLANNED", "ASSIGNED", "REJECTED", "IN_PROGRESS"],
    "ACTION_PLANNED": ["ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW", "REJECTED"],
    "ASSIGNED": ["IN_PROGRESS", "ACTION_PLANNED", "UNDER_REVIEW", "REJECTED"],
    "IN_PROGRESS": ["RESOLVED", "ACTION_PLANNED", "UNDER_REVIEW", "ASSIGNED"],
    "RESOLVED": ["UNDER_REVIEW"],  # Reopen on citizen appeal
    "CLOSED_INTERNAL": ["UNDER_REVIEW"],
    "REJECTED": ["UNDER_REVIEW"]   # Reopen on reassessment
}

@router.post("/{id}/assign", response_model=AssignmentResponse)
def assign_maintenance(
    id: int,
    assign_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["authority", "admin"]))
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    assignee = db.query(User).filter(User.id == assign_in.assigned_to_id).first()
    if not assignee or not assignee.is_active:
        raise HTTPException(status_code=400, detail="Assigned user not found or inactive")

    # Update report
    prev_status = report.workflow_status
    report.workflow_status = "ASSIGNED"
    report.assigned_authority_id = assignee.id

    # Create assignment
    assignment = MaintenanceAssignment(
        report_id=report.id,
        assigned_by_id=current_user.id,
        assigned_to_id=assignee.id,
        notes=assign_in.notes,
        priority_level=assign_in.priority_level or "MEDIUM",
        assignment_status="PENDING",
        target_completion_date=assign_in.target_completion_date,
        assigned_at=datetime.datetime.utcnow()
    )
    db.add(assignment)

    # Status History
    status_entry = StatusHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status="ASSIGNED",
        changed_by_id=current_user.id,
        notes=f"Assigned to {assignee.name}. Notes: {assign_in.notes or 'None'}"
    )
    db.add(status_entry)

    # Audit Log
    audit = AuditLog(
        actor_id=current_user.id,
        action="ASSIGNMENT_CREATE",
        target_type="MaintenanceAssignment",
        target_id=str(report.id),
        metadata_json=f'{{"assigned_to": "{assignee.name}", "priority": "{assign_in.priority_level}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id,
        report_id=assignment.report_id,
        assigned_by_id=assignment.assigned_by_id,
        assigned_by_name=current_user.name,
        assigned_to_id=assignment.assigned_to_id,
        assigned_to_name=assignee.name,
        notes=assignment.notes,
        priority_level=assignment.priority_level,
        assignment_status=assignment.assignment_status,
        target_completion_date=assignment.target_completion_date,
        assigned_at=assignment.assigned_at,
        completed_at=assignment.completed_at
    )


@router.post("/{id}/status", response_model=ReportDetailResponse)
def transition_status(
    id: int,
    trans_in: StatusTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["authority", "admin"]))
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    cur_status = report.workflow_status
    target_status = trans_in.new_status

    if target_status == cur_status:
        return get_report_detail(id, db)

    allowed_targets = VALID_TRANSITIONS.get(cur_status, [])
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal state transition from '{cur_status}' to '{target_status}'. Allowed targets: {allowed_targets}"
        )

    report.workflow_status = target_status
    if target_status == "RESOLVED":
        report.resolved_at = datetime.datetime.utcnow()
        report.resolved_by_id = current_user.id
        if trans_in.notes:
            report.resolution_notes = trans_in.notes
        if trans_in.resolution_image_path:
            report.resolution_image_path = trans_in.resolution_image_path

    # Status History
    status_entry = StatusHistory(
        report_id=report.id,
        previous_status=cur_status,
        new_status=target_status,
        changed_by_id=current_user.id,
        notes=trans_in.notes
    )
    db.add(status_entry)

    # Audit Log
    notes_str = trans_in.notes or ""
    audit = AuditLog(
        actor_id=current_user.id,
        action="STATUS_TRANSITION",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"from": "{cur_status}", "to": "{target_status}", "notes": "{notes_str}"}}'
    )
    db.add(audit)
    db.commit()

    return get_report_detail(id, db)


@router.post("/{id}/resolve", response_model=ReportDetailResponse)
def resolve_report(
    id: int,
    notes: str = Form(..., min_length=5),
    evidence_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["authority", "admin"]))
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    resolution_img_path = None
    if evidence_image:
        resolution_img_path = save_upload_image(evidence_image)

    cur_status = report.workflow_status
    report.workflow_status = "RESOLVED"
    report.resolved_at = datetime.datetime.utcnow()
    report.resolved_by_id = current_user.id
    report.resolution_notes = notes
    if resolution_img_path:
        report.resolution_image_path = resolution_img_path

    # Update active maintenance assignments if any
    for asgn in report.assignments:
        if asgn.assignment_status in ["PENDING", "IN_PROGRESS"]:
            asgn.assignment_status = "COMPLETED"
            asgn.completed_at = datetime.datetime.utcnow()

    # Status History
    status_entry = StatusHistory(
        report_id=report.id,
        previous_status=cur_status,
        new_status="RESOLVED",
        changed_by_id=current_user.id,
        notes=f"[Simulated Demonstration Workflow] Internal resolution recorded with maintenance evidence: {notes}"
    )
    db.add(status_entry)

    # Audit Log
    audit = AuditLog(
        actor_id=current_user.id,
        action="REPORT_RESOLVED",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"resolved_by": "{current_user.name}", "has_image": {resolution_img_path is not None}}}'
    )
    db.add(audit)
    db.commit()

    return get_report_detail(id, db)
