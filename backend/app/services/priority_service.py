from datetime import datetime
from typing import Dict, Any
from backend.app.config import settings

ROAD_CLASS_FACTORS = {
    "HIGHWAY": 100.0,
    "ARTERIAL": 85.0,
    "COLLECTOR": 65.0,
    "LOCAL": 40.0
}

class PriorityEngine:
    """
    Explainable Multi-Criteria Priority Ranking Engine for Municipal Road Maintenance.
    Combines physical severity, AI confidence, public report frequency, aging, and road importance.
    """

    def calculate_priority(
        self,
        severity_score: float,
        confidence: float,
        duplicate_count: int,
        created_at: datetime,
        road_classification: str = "LOCAL"
    ) -> Dict[str, Any]:
        w_sev = settings.WEIGHT_SEVERITY       # 0.40
        w_conf = settings.WEIGHT_CONFIDENCE    # 0.20
        w_dup = settings.WEIGHT_DUPLICATES     # 0.15
        w_age = settings.WEIGHT_AGING          # 0.15
        w_road = settings.WEIGHT_ROAD_CLASS    # 0.10

        # Component 1: Physical Severity Score (0-100)
        c_sev = max(0.0, min(100.0, severity_score))

        # Component 2: Evidence / Confidence Score (0-100)
        c_conf = max(0.0, min(100.0, confidence * 100.0))

        # Component 3: Citizen Repeat / Duplicate Signal
        # More citizens reporting the same damage increases public urgency
        c_dup = min(100.0, duplicate_count * 30.0)

        # Component 4: Aging Score (0-100)
        # 1 day waiting = 5 pts, reaches 100 pts after 20 days unattended
        days_waiting = max(0.0, (datetime.utcnow() - created_at).total_seconds() / 86400.0)
        c_age = min(100.0, days_waiting * 5.0)

        # Component 5: Road Classification
        c_road = ROAD_CLASS_FACTORS.get(road_classification.upper(), 40.0)

        # Weighted Sum
        priority_score = (
            w_sev * c_sev +
            w_conf * c_conf +
            w_dup * c_dup +
            w_age * c_age +
            w_road * c_road
        )
        priority_score = round(max(0.0, min(100.0, priority_score)), 1)

        # Baseline comparison: Severity-only score
        baseline_severity_rank = round(c_sev, 1)

        # Delta analysis (how much multi-criteria shifted priority relative to raw severity)
        rank_delta = round(priority_score - baseline_severity_rank, 1)

        return {
            "priority_score": priority_score,
            "baseline_severity_score": baseline_severity_rank,
            "rank_delta": rank_delta,
            "breakdown": {
                "severity_contribution": {
                    "raw_value": round(c_sev, 1),
                    "weight": w_sev,
                    "weighted_points": round(w_sev * c_sev, 1)
                },
                "confidence_contribution": {
                    "raw_value": round(c_conf, 1),
                    "weight": w_conf,
                    "weighted_points": round(w_conf * c_conf, 1)
                },
                "duplicate_reports_contribution": {
                    "raw_count": duplicate_count,
                    "raw_value": round(c_dup, 1),
                    "weight": w_dup,
                    "weighted_points": round(w_dup * c_dup, 1)
                },
                "aging_contribution": {
                    "days_waiting": round(days_waiting, 1),
                    "raw_value": round(c_age, 1),
                    "weight": w_age,
                    "weighted_points": round(w_age * c_age, 1)
                },
                "road_class_contribution": {
                    "classification": road_classification.upper(),
                    "raw_value": round(c_road, 1),
                    "weight": w_road,
                    "weighted_points": round(w_road * c_road, 1)
                }
            },
            "formula": (
                f"{w_sev}*Severity + {w_conf}*Confidence + {w_dup}*PublicSignal + "
                f"{w_age}*Aging + {w_road}*RoadTier"
            )
        }

priority_engine = PriorityEngine()
