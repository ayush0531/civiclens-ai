from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import AuditLog, User
from backend.app.schemas.schemas import AuditLogResponse
from backend.app.services.auth_service import require_roles

router = APIRouter(prefix="/audit-logs", tags=["Audit Trails"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "authority"]))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action.upper())

    offset = (page - 1) * limit
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()

    results = []
    for log in logs:
        log_res = AuditLogResponse.model_validate(log)
        if log.actor:
            log_res.actor_name = f"{log.actor.name} ({log.actor.role})"
        results.append(log_res)

    return results
