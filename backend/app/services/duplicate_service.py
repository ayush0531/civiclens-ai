import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from PIL import Image
from sqlalchemy.orm import Session
from backend.app.models.models import RoadDamageReport

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

def compute_dhash(image_path: str, hash_size: int = 8) -> Optional[int]:
    """
    Computes a 64-bit difference hash (dHash) for visual perceptual comparison.
    """
    try:
        with Image.open(image_path) as img:
            # Resize to (width + 1, height), grayscale
            resized = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(resized.getdata())
            
            # Compare adjacent pixels
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left = pixels[row * (hash_size + 1) + col]
                    right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(left > right)
            
            # Convert boolean array to integer
            decimal_val = 0
            for bit in diff:
                decimal_val = (decimal_val << 1) | int(bit)
            return decimal_val
    except Exception:
        return None

def hamming_similarity(hash1: Optional[int], hash2: Optional[int], bits: int = 64) -> float:
    """
    Returns normalized visual similarity from 0.0 (completely different) to 1.0 (identical).
    """
    if hash1 is None or hash2 is None:
        return 0.5  # Neutral fallback when images cannot be compared
    xor = hash1 ^ hash2
    distance = bin(xor).count("1")
    similarity = max(0.0, 1.0 - (distance / float(bits)))
    return similarity

class DuplicateDetectionService:
    def __init__(self, max_distance_meters: float = 120.0, max_time_days: int = 45):
        self.max_distance_meters = max_distance_meters
        self.max_time_days = max_time_days

    def find_potential_duplicates(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        current_report_id: Optional[int] = None,
        image_path: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Finds candidate duplicates based on geographic proximity, submission time,
        and perceptual image hash similarity.
        """
        # Bounding box filter for fast spatial pre-query (approx 150m in degrees)
        lat_delta = self.max_distance_meters / 111320.0
        lon_delta = self.max_distance_meters / (111320.0 * math.cos(math.radians(latitude)))

        query = db.query(RoadDamageReport).filter(
            RoadDamageReport.latitude.between(latitude - lat_delta, latitude + lat_delta),
            RoadDamageReport.longitude.between(longitude - lon_delta, longitude + lon_delta),
            RoadDamageReport.workflow_status != "REJECTED"
        )
        if current_report_id:
            query = query.filter(RoadDamageReport.id != current_report_id)

        candidates = query.all()
        target_hash = compute_dhash(image_path) if image_path else None

        results = []
        for cand in candidates:
            dist_m = haversine_distance(latitude, longitude, cand.latitude, cand.longitude)
            if dist_m > self.max_distance_meters:
                continue

            # Distance Score: 1.0 at 0m, 0.0 at max_distance_meters
            geo_score = max(0.0, 1.0 - (dist_m / self.max_distance_meters))

            # Time Score: 1.0 if within 5 days, declining to 0.0 at max_time_days
            days_diff = abs((datetime.utcnow() - cand.created_at).total_seconds()) / 86400.0
            time_score = max(0.0, 1.0 - (days_diff / float(self.max_time_days)))

            # Image perceptual similarity
            cand_hash = compute_dhash(cand.image_path) if cand.image_path else None
            visual_sim = hamming_similarity(target_hash, cand_hash)

            # Combined match score (Geo: 55%, Visual: 25%, Time: 20%)
            match_score = round(0.55 * geo_score + 0.25 * visual_sim + 0.20 * time_score, 3)

            # Threshold for reporting as duplicate candidate
            if match_score >= 0.50 or dist_m <= 35.0:
                results.append({
                    "candidate_report_id": cand.id,
                    "reference_number": cand.reference_number,
                    "title": cand.title,
                    "distance_meters": round(dist_m, 1),
                    "days_ago": round(days_diff, 1),
                    "visual_similarity": round(visual_sim, 2),
                    "match_score": match_score,
                    "is_probable_duplicate": match_score >= 0.70 or dist_m <= 25.0,
                    "category": cand.predicted_damage_category,
                    "workflow_status": cand.workflow_status
                })

        # Sort descending by match score
        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results

duplicate_service = DuplicateDetectionService()
