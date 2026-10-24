from datetime import datetime
from typing import Dict, Any, Optional, List
from backend.app.config import settings

ROAD_CLASS_FACTORS = {
    "HIGHWAY": 100.0,
    "ARTERIAL": 85.0,
    "COLLECTOR": 65.0,
    "LOCAL": 40.0
}

TRAFFIC_SAFETY_FACTORS = {
    "HIGHWAY": 95.0,
    "ARTERIAL": 90.0,
    "COLLECTOR": 65.0,
    "LOCAL": 45.0
}

class PriorityEngine:
    """
    CivicLens AI 2.0 Explainable Multi-Criteria Priority Ranking Engine.
    Combines:
    1. Physical Severity (w_sev)
    2. Detection Evidence Quality (w_conf)
    3. Citizen Repeat Grievance Signal (w_dup)
    4. Aging Delay Penalty (w_age)
    5. Road Hierarchy Tier (w_road)
    6. Traffic Safety Exposure (w_traffic)
    """

    def __init__(self):
        # Default policy weights
        self.policy = {
            "w_sev": settings.WEIGHT_SEVERITY,            # 0.35
            "w_conf": settings.WEIGHT_CONFIDENCE,         # 0.15
            "w_dup": settings.WEIGHT_DUPLICATES,          # 0.15
            "w_age": settings.WEIGHT_AGING,               # 0.15
            "w_road": settings.WEIGHT_ROAD_CLASS,         # 0.10
            "w_traffic": settings.WEIGHT_TRAFFIC_SAFETY,  # 0.10
        }

    def get_policy(self) -> Dict[str, float]:
        return self.policy.copy()

    def update_policy(self, new_policy: Dict[str, float]) -> Dict[str, float]:
        # Validate weights sum to ~1.0
        total_w = sum(new_policy.values())
        if not (0.95 <= total_w <= 1.05):
            raise ValueError(f"Policy weights must sum to approximately 1.0 (got {round(total_w, 2)})")
        
        for k in self.policy.keys():
            if k in new_policy:
                self.policy[k] = round(float(new_policy[k]), 3)
        return self.policy.copy()

    def calculate_priority(
        self,
        severity_score: float,
        confidence: float,
        duplicate_count: int,
        created_at: datetime,
        road_classification: str = "LOCAL"
    ) -> Dict[str, Any]:
        p = self.policy
        w_sev = p["w_sev"]
        w_conf = p["w_conf"]
        w_dup = p["w_dup"]
        w_age = p["w_age"]
        w_road = p["w_road"]
        w_traffic = p["w_traffic"]

        # Component 1: Physical Severity Score (0-100)
        c_sev = max(0.0, min(100.0, severity_score))

        # Component 2: Evidence Clarity / Confidence Score (0-100)
        c_conf = max(0.0, min(100.0, confidence * 100.0))

        # Component 3: Citizen Repeat Complaint Signal (0-100)
        c_dup = min(100.0, duplicate_count * 30.0)

        # Component 4: Waiting Aging Delay (0-100)
        days_waiting = max(0.0, (datetime.utcnow() - created_at).total_seconds() / 86400.0)
        c_age = min(100.0, days_waiting * 5.0)

        # Component 5: Road Classification Hierarchy (0-100)
        c_road = ROAD_CLASS_FACTORS.get(road_classification.upper(), 40.0)

        # Component 6: Traffic Safety / Pedestrian Exposure (0-100)
        c_traffic = TRAFFIC_SAFETY_FACTORS.get(road_classification.upper(), 45.0)

        # Multi-Criteria Weighted Sum
        priority_score = (
            w_sev * c_sev +
            w_conf * c_conf +
            w_dup * c_dup +
            w_age * c_age +
            w_road * c_road +
            w_traffic * c_traffic
        )
        priority_score = round(max(0.0, min(100.0, priority_score)), 1)

        # Baseline Comparison
        baseline_severity_rank = round(c_sev, 1)
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
                },
                "traffic_safety_contribution": {
                    "raw_value": round(c_traffic, 1),
                    "weight": w_traffic,
                    "weighted_points": round(w_traffic * c_traffic, 1)
                }
            },
            "formula": (
                f"{w_sev}*Severity + {w_conf}*Confidence + {w_dup}*PublicSignal + "
                f"{w_age}*Aging + {w_road}*RoadTier + {w_traffic}*TrafficSafety"
            ),
            "policy_version": "2.0.0"
        }

priority_engine = PriorityEngine()
