import os
import json
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.models import RoadDamageReport, AIAnalysis, AuditLog, User
from backend.app.schemas.schemas import AIAnalysisResponse, QuickInspectResponse
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.ai_service import ai_service
from backend.app.services.duplicate_service import duplicate_service
from backend.app.services.priority_service import priority_engine
from backend.app.utils.file_storage import save_upload_image

router = APIRouter(tags=["AI Road Damage Inference & Evaluation"])

@router.post("/reports/{id}/analyze", response_model=AIAnalysisResponse)
def run_ai_analysis(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(RoadDamageReport).filter(RoadDamageReport.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )

    image_abs_path = os.path.join(settings.BASE_DIR, report.image_path.lstrip("/"))
    if not os.path.exists(image_abs_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source image file does not exist on disk."
        )

    # Annotated image destination
    annotated_filename = f"{uuid.uuid4().hex}_annotated.jpg"
    annotated_abs_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)
    annotated_rel_path = f"/uploads/{annotated_filename}"

    # Run AI inference / heuristic analysis
    analysis_result = ai_service.analyze_image(
        image_path=image_abs_path,
        output_annotated_path=annotated_abs_path
    )

    # Update report attributes
    report.predicted_damage_category = analysis_result["predicted_damage_category"]
    report.prediction_confidence = analysis_result["prediction_confidence"]
    report.severity_score = analysis_result["severity_score"]
    report.severity_level = analysis_result["severity_level"]
    report.annotated_image_path = annotated_rel_path

    # Recalculate Priority
    dup_candidates = duplicate_service.find_potential_duplicates(
        db=db,
        latitude=report.latitude,
        longitude=report.longitude,
        current_report_id=report.id,
        image_path=image_abs_path
    )
    priority_res = priority_engine.calculate_priority(
        severity_score=report.severity_score,
        confidence=report.prediction_confidence,
        duplicate_count=len(dup_candidates),
        created_at=report.created_at,
        road_classification=report.road_classification
    )
    report.priority_score = priority_res["priority_score"]

    # Store analysis record
    analysis_rec = AIAnalysis(
        report_id=report.id,
        model_identifier=analysis_result["model_identifier"],
        model_version=analysis_result["model_version"],
        inference_mode=analysis_result["inference_mode"],
        predicted_classes=json.dumps(analysis_result["predicted_classes"]),
        confidence_scores=json.dumps(analysis_result["confidence_scores"]),
        bounding_boxes=json.dumps(analysis_result["bounding_boxes"]),
        severity_breakdown=json.dumps(analysis_result["severity_breakdown"]),
        analysis_metadata=json.dumps(analysis_result.get("analysis_metadata", {})),
        inference_duration_ms=analysis_result["inference_duration_ms"],
        is_demo_result=analysis_result["is_demo_result"],
        disclaimer=analysis_result["disclaimer"]
    )
    db.add(analysis_rec)

    # Record Audit
    audit = AuditLog(
        actor_id=current_user.id,
        action="AI_ANALYSIS_RUN",
        target_type="RoadDamageReport",
        target_id=str(report.id),
        metadata_json=f'{{"mode": "{analysis_result["inference_mode"]}", "category": "{report.predicted_damage_category}", "severity": {report.severity_score}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(analysis_rec)

    return AIAnalysisResponse(
        id=analysis_rec.id,
        report_id=analysis_rec.report_id,
        model_identifier=analysis_rec.model_identifier,
        model_version=analysis_rec.model_version,
        inference_mode=analysis_rec.inference_mode,
        predicted_classes=json.loads(analysis_rec.predicted_classes),
        confidence_scores=json.loads(analysis_rec.confidence_scores),
        bounding_boxes=json.loads(analysis_rec.bounding_boxes),
        severity_breakdown=json.loads(analysis_rec.severity_breakdown),
        analysis_metadata=json.loads(analysis_rec.analysis_metadata) if analysis_rec.analysis_metadata else {},
        inference_duration_ms=analysis_rec.inference_duration_ms,
        is_demo_result=analysis_rec.is_demo_result,
        disclaimer=analysis_rec.disclaimer,
        created_at=analysis_rec.created_at
    )


@router.post("/ai/quick-inspect", response_model=QuickInspectResponse)
def quick_inspect_image(
    image: UploadFile = File(...)
):
    """
    Pre-submission instant AI road-defect analysis.
    Allows citizens and reviewers to preview bounding box overlays, distress category,
    confidence, and estimated severity before committing a report to the database.
    """
    image_rel_path = save_upload_image(image)
    image_abs_path = os.path.join(settings.BASE_DIR, image_rel_path.lstrip("/"))

    annotated_filename = f"{uuid.uuid4().hex}_annotated.jpg"
    annotated_abs_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)
    annotated_rel_path = f"/uploads/{annotated_filename}"

    analysis_result = ai_service.analyze_image(
        image_path=image_abs_path,
        output_annotated_path=annotated_abs_path
    )

    return QuickInspectResponse(
        predicted_damage_category=analysis_result["predicted_damage_category"],
        prediction_confidence=analysis_result["prediction_confidence"],
        severity_score=analysis_result["severity_score"],
        severity_level=analysis_result["severity_level"],
        severity_breakdown=analysis_result["severity_breakdown"],
        bounding_boxes=analysis_result["bounding_boxes"],
        annotated_image_path=annotated_rel_path,
        inference_duration_ms=analysis_result["inference_duration_ms"],
        inference_mode=analysis_result["inference_mode"],
        model_identifier=analysis_result["model_identifier"],
        is_demo_result=analysis_result["is_demo_result"],
        disclaimer=analysis_result["disclaimer"]
    )


@router.get("/ai/evaluation")
def get_model_evaluation_benchmarks() -> Dict[str, Any]:
    """
    Returns empirical evaluation laboratory metrics for YOLOv8-RDD2022.
    """
    return ai_service.get_evaluation_laboratory_benchmarks()


@router.get("/ai/status")
def get_ai_status() -> Dict[str, Any]:
    return ai_service.get_engine_info()


@router.post("/ai/mode")
def set_ai_inference_mode(
    payload: Dict[str, str] = Body(...),
    current_user: User = Depends(require_roles(["admin", "authority"]))
):
    target_mode = payload.get("mode", "REAL")
    ai_service.set_mode(target_mode)
    return {
        "message": f"AI Inference mode switched to {ai_service.mode}",
        "engine_info": ai_service.get_engine_info()
    }
