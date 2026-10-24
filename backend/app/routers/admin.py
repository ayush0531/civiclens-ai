import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.models import User, RoadDamageReport, AIAnalysis, MaintenanceAssignment, AuditLog
from backend.app.schemas.schemas import UserResponse, UserUpdateRole
from backend.app.services.auth_service import require_roles
from backend.app.services.ai_service import ai_service
from backend.app.utils.seed_data import seed_database

router = APIRouter(prefix="/admin", tags=["Admin & System Management"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/users/{id}/role", response_model=UserResponse)
def update_user_role(
    id: int,
    update_in: UserUpdateRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id and update_in.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot downgrade your own administrative privileges.")

    prev_role = user.role
    user.role = update_in.role
    if update_in.is_active is not None:
        user.is_active = update_in.is_active
    if update_in.department is not None:
        user.department = update_in.department

    audit = AuditLog(
        actor_id=current_user.id,
        action="USER_ROLE_UPDATE",
        target_type="User",
        target_id=str(user.id),
        metadata_json=f'{{"from_role": "{prev_role}", "new_role": "{user.role}", "active": {user.is_active}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/reseed")
def reseed_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    stats = seed_database(db=db, force=True)
    audit = AuditLog(
        actor_id=current_user.id,
        action="SYSTEM_RESEED",
        target_type="Database",
        target_id="ALL",
        metadata_json=str(stats)
    )
    db.add(audit)
    db.commit()
    return {"message": "Database reseeded successfully with synthetic Nagpur demo records.", "stats": stats}


@router.get("/system-status")
def get_system_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "authority"]))
):
    engine_info = ai_service.get_engine_info()
    
    # Calculate storage size
    upload_count = 0
    upload_size_bytes = 0
    if os.path.exists(settings.UPLOAD_DIR):
        for root, _, files in os.walk(settings.UPLOAD_DIR):
            for f in files:
                upload_count += 1
                try:
                    upload_size_bytes += os.path.getsize(os.path.join(root, f))
                except Exception:
                    pass

    return {
        "status": "HEALTHY",
        "timestamp": os.getenv("DEPLOY_TIMESTAMP", "2025-Q2"),
        "database": {
            "type": "SQLite (WAL Mode)",
            "users_count": db.query(User).count(),
            "reports_count": db.query(RoadDamageReport).count(),
            "synthetic_reports_count": db.query(RoadDamageReport).filter(RoadDamageReport.is_demo_data == True).count(),
            "analyses_count": db.query(AIAnalysis).count(),
            "assignments_count": db.query(MaintenanceAssignment).count(),
            "audit_logs_count": db.query(AuditLog).count()
        },
        "storage": {
            "upload_files_count": upload_count,
            "upload_size_mb": round(upload_size_bytes / (1024 * 1024), 2),
            "max_allowed_mb": settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        },
        "ai_engine": engine_info
    }
