import math
from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session
from backend.app.models.models import RoadDamageReport
from backend.app.services.duplicate_service import haversine_distance

class SpatialClusteringService:
    """
    Geospatial Hotspot Clustering Engine using Haversine-metric DBSCAN.
    Groups proximate defects within 400m into municipal repair clusters.
    """

    def find_clusters(self, db: Session, eps_meters: float = 450.0, min_samples: int = 2) -> List[Dict[str, Any]]:
        reports = db.query(RoadDamageReport).filter(
            RoadDamageReport.workflow_status != "REJECTED"
        ).all()

        if len(reports) < min_samples:
            return []

        # Convert coordinates to radians for spherical metric
        coords = np.array([[math.radians(r.latitude), math.radians(r.longitude)] for r in reports])
        
        # Earth radius in meters
        kms_per_radian = 6371000.0
        epsilon_radians = eps_meters / kms_per_radian

        dbscan = DBSCAN(eps=epsilon_radians, min_samples=min_samples, metric='haversine')
        cluster_labels = dbscan.fit_predict(coords)

        clusters_dict: Dict[int, List[RoadDamageReport]] = {}
        for idx, label in enumerate(cluster_labels):
            if label != -1:  # -1 represents noise points
                if label not in clusters_dict:
                    clusters_dict[label] = []
                clusters_dict[label].append(reports[idx])

        results = []
        for cluster_id, cluster_reports in clusters_dict.items():
            lats = [r.latitude for r in cluster_reports]
            lons = [r.longitude for r in cluster_reports]
            centroid_lat = round(float(np.mean(lats)), 6)
            centroid_lon = round(float(np.mean(lons)), 6)

            # Compute maximum radius from centroid in meters
            max_radius = max(haversine_distance(centroid_lat, centroid_lon, r.latitude, r.longitude) for r in cluster_reports)
            max_radius = max(80.0, round(max_radius, 1))

            # Average severity
            avg_sev = round(float(np.mean([r.severity_score for r in cluster_reports])), 1)

            # Dominant category
            categories = [r.predicted_damage_category for r in cluster_reports]
            dominant_cat = max(set(categories), key=categories.count)

            # Common landmark/address
            addresses = [r.address_text for r in cluster_reports if r.address_text]
            common_area = addresses[0].split(",")[0] if addresses else "Nagpur Metro Corridor"

            # Cluster hazard classification
            if avg_sev >= 65.0:
                hazard_level = "CRITICAL"
            elif avg_sev >= 45.0:
                hazard_level = "HIGH"
            else:
                hazard_level = "MODERATE"

            results.append({
                "cluster_id": int(cluster_id) + 1,
                "area_name": common_area,
                "centroid_latitude": centroid_lat,
                "centroid_longitude": centroid_lon,
                "radius_meters": max_radius,
                "report_count": len(cluster_reports),
                "average_severity": avg_sev,
                "hazard_level": hazard_level,
                "dominant_category": dominant_cat,
                "report_ids": [r.id for r in cluster_reports],
                "reference_numbers": [r.reference_number for r in cluster_reports]
            })

        # Sort descending by report count and severity
        results.sort(key=lambda c: (c["report_count"], c["average_severity"]), reverse=True)
        return results

cluster_service = SpatialClusteringService()
