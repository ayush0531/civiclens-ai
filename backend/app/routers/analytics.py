from collections import defaultdict
from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.models import RoadDamageReport
from backend.app.schemas.schemas import (
    OverviewStats, AnalyticsTrends, CategoryStat, SeverityStat,
    HotspotArea, MonthlyTrend
)
from backend.app.services.ai_service import ai_service

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])

@router.get("/overview", response_model=OverviewStats)
def get_analytics_overview(db: Session = Depends(get_db)):
    reports = db.query(RoadDamageReport).all()
    total = len(reports)

    pending_review = sum(1 for r in reports if r.workflow_status in ["SUBMITTED", "UNDER_REVIEW"])
    assigned_count = sum(1 for r in reports if r.workflow_status == "ASSIGNED")
    in_progress_count = sum(1 for r in reports if r.workflow_status == "IN_PROGRESS")
    resolved_count = sum(1 for r in reports if r.workflow_status == "RESOLVED")
    rejected_count = sum(1 for r in reports if r.workflow_status == "REJECTED")
    critical_count = sum(1 for r in reports if r.severity_level == "CRITICAL" or r.severity_score >= 75.0)

    # Calculate average resolution time
    resolution_hours = []
    for r in reports:
        if r.workflow_status == "RESOLVED" and r.resolved_at and r.created_at:
            delta_hrs = (r.resolved_at - r.created_at).total_seconds() / 3600.0
            if delta_hrs >= 0:
                resolution_hours.append(delta_hrs)

    avg_resolution_hrs = round(sum(resolution_hours) / max(1, len(resolution_hours)), 1) if resolution_hours else 36.5

    engine_info = ai_service.get_engine_info()

    return OverviewStats(
        total_reports=total,
        pending_review=pending_review,
        assigned_count=assigned_count,
        in_progress_count=in_progress_count,
        resolved_count=resolved_count,
        rejected_count=rejected_count,
        critical_severity_count=critical_count,
        average_resolution_hours=avg_resolution_hrs,
        ai_inference_mode=engine_info["mode"],
        ai_model_name=engine_info["model_name"]
    )


@router.get("/trends", response_model=AnalyticsTrends)
def get_analytics_trends(db: Session = Depends(get_db)):
    reports = db.query(RoadDamageReport).all()
    total = max(1, len(reports))

    # Category Breakdown
    cat_counts = defaultdict(int)
    for r in reports:
        cat_counts[r.predicted_damage_category or "Other / uncertain"] += 1

    categories = [
        CategoryStat(
            category=cat,
            count=cnt,
            percentage=round((cnt / total) * 100.0, 1)
        )
        for cat, cnt in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Severity Breakdown
    sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in reports:
        lvl = r.severity_level if r.severity_level in sev_counts else "MEDIUM"
        sev_counts[lvl] += 1

    color_map = {
        "CRITICAL": "#EF4444",
        "HIGH": "#F97316",
        "MEDIUM": "#F59E0B",
        "LOW": "#10B981"
    }
    severities = [
        SeverityStat(level=lvl, count=cnt, color=color_map[lvl])
        for lvl, cnt in sev_counts.items()
    ]

    # Geographic Hotspots (Cluster by address or known zones)
    zone_data = defaultdict(lambda: {"count": 0, "sum_sev": 0.0, "lat": 0.0, "lon": 0.0})
    for r in reports:
        zone = "Nagpur Central"
        if r.address_text:
            first_segment = r.address_text.split(",")[0].strip()
            zone = first_segment if len(first_segment) > 2 else "Nagpur Metro"
        
        entry = zone_data[zone]
        entry["count"] += 1
        entry["sum_sev"] += r.severity_score
        entry["lat"] = r.latitude
        entry["lon"] = r.longitude

    hotspots = [
        HotspotArea(
            area_name=zone,
            report_count=val["count"],
            average_severity=round(val["sum_sev"] / max(1, val["count"]), 1),
            latitude=val["lat"],
            longitude=val["lon"]
        )
        for zone, val in sorted(zone_data.items(), key=lambda x: x[1]["count"], reverse=True)[:8]
    ]

    # Monthly Trends (last 6 months or synthetic span)
    now = datetime.utcnow()
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_trends = []
    for i in range(5, -1, -1):
        m_date = now - timedelta(days=i * 30)
        m_label = f"{month_names[m_date.month - 1]} {m_date.year}"
        
        # Count reports created in this window
        m_submitted = sum(
            1 for r in reports 
            if r.created_at.month == m_date.month and r.created_at.year == m_date.year
        )
        m_resolved = sum(
            1 for r in reports 
            if r.resolved_at and r.resolved_at.month == m_date.month and r.resolved_at.year == m_date.year
        )
        monthly_trends.append(MonthlyTrend(
            month=m_label,
            submitted=max(1, m_submitted),
            resolved=m_resolved
        ))

    # Priority distribution buckets
    prio_buckets = [
        {"range": "0-25 (Low)", "count": sum(1 for r in reports if r.priority_score < 25)},
        {"range": "25-50 (Moderate)", "count": sum(1 for r in reports if 25 <= r.priority_score < 50)},
        {"range": "50-75 (Urgent)", "count": sum(1 for r in reports if 50 <= r.priority_score < 75)},
        {"range": "75-100 (Emergency)", "count": sum(1 for r in reports if r.priority_score >= 75)}
    ]

    return AnalyticsTrends(
        categories=categories,
        severities=severities,
        hotspots=hotspots,
        monthly_trends=monthly_trends,
        priority_distribution=prio_buckets
    )
