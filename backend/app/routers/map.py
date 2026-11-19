from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RoadDamageReport, NagpurWard
from backend.app.schemas.schemas import MapReportMarker, NagpurWardResponse
from backend.app.services.cluster_service import cluster_service

router = APIRouter(prefix="/map", tags=["Geospatial Map & Hotspots"])

@router.get("/reports", response_model=List[MapReportMarker])
def get_map_markers(
    category: Optional[str] = Query(None),
    severity_level: Optional[str] = Query(None),
    workflow_status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RoadDamageReport)

    if category:
        query = query.filter(RoadDamageReport.predicted_damage_category.ilike(f"%{category}%"))

    if severity_level:
        query = query.filter(RoadDamageReport.severity_level == severity_level.upper())

    if workflow_status:
        query = query.filter(RoadDamageReport.workflow_status == workflow_status.upper())

    reports = query.all()

    markers = []
    for r in reports:
        markers.append(MapReportMarker(
            id=r.id,
            reference_number=r.reference_number,
            title=r.title,
            latitude=r.latitude,
            longitude=r.longitude,
            address_text=r.address_text,
            predicted_damage_category=r.predicted_damage_category,
            severity_score=r.severity_score,
            severity_level=r.severity_level,
            priority_score=r.priority_score,
            workflow_status=r.workflow_status,
            image_path=r.image_path,
            created_at=r.created_at
        ))

    return markers

@router.get("/clusters")
def get_spatial_clusters(
    radius_meters: float = Query(450.0, ge=100.0, le=2000.0),
    min_points: int = Query(2, ge=2, le=10),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Returns spatial clusters computed via Haversine DBSCAN on defect coordinates.
    """
    return cluster_service.find_clusters(db=db, eps_meters=radius_meters, min_samples=min_points)


@router.get("/wards", response_model=List[NagpurWardResponse])
def get_nagpur_wards(db: Session = Depends(get_db)):
    """
    Returns the 10 administrative zones/wards of Nagpur Municipal Corporation (NMC)
    with GeoJSON polygon boundary rings and supervising zonal officers.
    """
    wards = db.query(NagpurWard).order_by(NagpurWard.zone_number.asc()).all()
    
    # Calculate live defect counts for each ward
    results = []
    for w in wards:
        count = db.query(RoadDamageReport).filter(
            RoadDamageReport.ward_name == w.ward_name,
            RoadDamageReport.workflow_status.notin_(["RESOLVED", "REJECTED"])
        ).count()
        w_dict = NagpurWardResponse.model_validate(w)
        w_dict.active_defects_count = count
        results.append(w_dict)

    return results

