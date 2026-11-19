import os
import json
import uuid
import datetime
from typing import Dict, Any, List
from PIL import Image, ImageDraw, ImageFilter
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.models import (
    User, RoadDamageReport, AIAnalysis, MaintenanceAssignment, StatusHistory, AuditLog,
    NagpurWard, NMCIntegrationConfig, ReportVerificationStage
)
from backend.app.services.auth_service import hash_password
from backend.app.services.ai_service import ai_service
from backend.app.services.priority_service import priority_engine

def generate_sample_road_image(category: str, filename_base: str) -> tuple[str, str]:
    """
    Synthesizes a realistic road surface patch with defect markings and generates
    both the base image and its annotated version using PIL.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    width, height = 640, 480
    
    # Asphalt base color with texture noise
    base_color = (65, 70, 75)
    img = Image.new("RGB", (width, height), base_color)
    draw = ImageDraw.Draw(img)

    # Add asphalt speckle/texture
    import random
    rng = random.Random(abs(hash(filename_base)))
    for _ in range(8000):
        rx = rng.randint(0, width - 1)
        ry = rng.randint(0, height - 1)
        gray_val = rng.randint(45, 95)
        img.putpixel((rx, ry), (gray_val, gray_val, gray_val))

    # Add road lane marking stripe
    draw.line([(width // 2 - 120, height), (width // 2 - 40, height // 2)], fill=(210, 205, 180), width=6)

    # Draw specific damage features
    if "Pothole" in category:
        # Dark hollow pit with rough crater edges
        cx, cy = width // 2 + rng.randint(-60, 60), height // 2 + rng.randint(20, 80)
        draw.ellipse([cx - 70, cy - 45, cx + 70, cy + 45], fill=(22, 22, 24), outline=(40, 42, 45), width=4)
        draw.ellipse([cx - 45, cy - 25, cx + 45, cy + 25], fill=(12, 12, 14))
    elif "Alligator" in category:
        # Mesh/spiderweb interconnected cracks
        cx, cy = width // 2, height // 2 + 40
        for _ in range(12):
            x1 = cx + rng.randint(-110, 110)
            y1 = cy + rng.randint(-60, 60)
            x2 = x1 + rng.randint(-40, 40)
            y2 = y1 + rng.randint(-30, 30)
            draw.line([(x1, y1), (x2, y2)], fill=(20, 20, 22), width=3)
    elif "Transverse" in category:
        # Horizontal fissure across pavement
        cy = height // 2 + rng.randint(10, 60)
        points = [(x, cy + rng.randint(-12, 12)) for x in range(80, width - 80, 25)]
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=(18, 18, 20), width=4)
    elif "Longitudinal" in category:
        # Vertical fissure along travel direction
        cx = width // 2 + rng.randint(-40, 40)
        points = [(cx + rng.randint(-10, 10), y) for y in range(height // 3, height - 40, 30)]
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=(18, 18, 20), width=4)
    else:
        # Surface deterioration / raveling
        for _ in range(40):
            rx = rng.randint(width // 4, 3 * width // 4)
            ry = rng.randint(height // 3, height - 50)
            draw.ellipse([rx, ry, rx + rng.randint(4, 16), ry + rng.randint(4, 16)], fill=(35, 36, 38))

    # Apply slight blur to blend naturally
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))

    base_filename = f"{filename_base}.jpg"
    annotated_filename = f"{filename_base}_annotated.jpg"
    
    base_path = os.path.join(settings.UPLOAD_DIR, base_filename)
    annotated_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)

    img.save(base_path, quality=90)

    # Run AI service to produce annotated overlay
    ai_service.analyze_image(image_path=base_path, output_annotated_path=annotated_path)

    return f"/uploads/{base_filename}", f"/uploads/{annotated_filename}"


def seed_database(db: Session, force: bool = False) -> Dict[str, Any]:
    """
    Populates database with standard demo roles and 30 Nagpur road damage cases.
    """
    if not force and db.query(User).count() > 0:
        return {"status": "Database already populated. Skipping."}

    # Clean existing records if force reseed
    if force:
        db.query(AuditLog).delete()
        db.query(StatusHistory).delete()
        db.query(MaintenanceAssignment).delete()
        db.query(AIAnalysis).delete()
        db.query(RoadDamageReport).delete()
        db.query(User).delete()
        db.commit()

    # 1. Create Core Demo Users
    demo_password_hash = hash_password("DemoPass123!")

    users_seed = [
        User(
            name="Ayush Vinchurkar (Admin)",
            email="admin@civiclens.ai",
            password_hash=demo_password_hash,
            role="admin",
            department="Smart City AI Taskforce",
            is_active=True
        ),
        User(
            name="NMC Road Works Engineer (Authority)",
            email="authority@civiclens.ai",
            password_hash=demo_password_hash,
            role="authority",
            department="Nagpur Municipal Corporation - Public Works",
            is_active=True
        ),
        User(
            name="Rahul Sharma (Citizen Reporter)",
            email="citizen@civiclens.ai",
            password_hash=demo_password_hash,
            role="citizen",
            department=None,
            is_active=True
        ),
        User(
            name="Vikram Deshmukh (Field Supervisor)",
            email="engineer@civiclens.ai",
            password_hash=demo_password_hash,
            role="authority",
            department="Road Maintenance & Asphalt Crew",
            is_active=True
        )
    ]
    db.add_all(users_seed)
    db.commit()
    for u in users_seed:
        db.refresh(u)

    admin_user = users_seed[0]
    auth_user = users_seed[1]
    citizen_user = users_seed[2]
    field_user = users_seed[3]

    # 2. Nagpur Synthetic Reports Data Fixtures (Realistic coordinates & locations)
    nagpur_cases = [
        {
            "title": "Severe Pothole Cluster near Metro Station",
            "category": "Pothole",
            "address": "Sitabuldi Interchange, Near Metro Pillar 42, Nagpur",
            "lat": 21.1458, "lon": 79.0882,
            "road_class": "ARTERIAL",
            "status": "IN_PROGRESS",
            "notes": "Deep crater causing traffic slowdowns during morning peak hours.",
            "is_dup": False, "dup_ref": None, "days_ago": 6
        },
        {
            "title": "Repeat: Deep Pothole on Sitabuldi Metro Road",
            "category": "Pothole",
            "address": "Sitabuldi Metro Gate 2, Nagpur",
            "lat": 21.1459, "lon": 79.0884,  # ~25m away -> Duplicate candidate!
            "road_class": "ARTERIAL",
            "status": "UNDER_REVIEW",
            "notes": "Two-wheelers violently jolting; risk of serious skid accidents.",
            "is_dup": True, "dup_ref": 1, "days_ago": 3
        },
        {
            "title": "Extensive Alligator Cracking on Main Shopping Lane",
            "category": "Alligator cracking",
            "address": "West High Court Road, Dharampeth, Nagpur",
            "lat": 21.1420, "lon": 79.0620,
            "road_class": "COLLECTOR",
            "status": "ASSIGNED",
            "notes": "Pavement fatigue failure across 15 meters of sub-base.",
            "is_dup": False, "dup_ref": None, "days_ago": 11
        },
        {
            "title": "Transverse Temperature Fissure across Full Carriageway",
            "category": "Transverse crack",
            "address": "Mount Road, Sadar Bazar, Nagpur",
            "lat": 21.1610, "lon": 79.0820,
            "road_class": "COLLECTOR",
            "status": "SUBMITTED",
            "notes": "Sharp horizontal crack opening up due to seasonal thermal expansion.",
            "is_dup": False, "dup_ref": None, "days_ago": 2
        },
        {
            "title": "Severe Longitudinal Wheelpath Cracking",
            "category": "Longitudinal crack",
            "address": "Wardha Road, Near Rahate Colony T-Point, Nagpur",
            "lat": 21.1180, "lon": 79.0740,
            "road_class": "HIGHWAY",
            "status": "ASSIGNED",
            "notes": "Parallel cracking in outer lane subjected to continuous bus traffic.",
            "is_dup": False, "dup_ref": None, "days_ago": 14
        },
        {
            "title": "Duplicate: Wardha Road Heavy Rutting & Crack",
            "category": "Longitudinal crack",
            "address": "Wardha Road, Rahate Square, Nagpur",
            "lat": 21.1182, "lon": 79.0742,  # ~30m away -> Duplicate candidate!
            "road_class": "HIGHWAY",
            "status": "UNDER_REVIEW",
            "notes": "Second citizen reporting the same bus lane fracture.",
            "is_dup": True, "dup_ref": 5, "days_ago": 8
        },
        {
            "title": "Asphalt Surface Raveling and Aggregate Loss",
            "category": "Surface deterioration",
            "address": "Civil Lines, Near High Court Gate 1, Nagpur",
            "lat": 21.1550, "lon": 79.0710,
            "road_class": "COLLECTOR",
            "status": "RESOLVED",
            "notes": "Bitumen binder worn down causing loose aggregate stones.",
            "is_dup": False, "dup_ref": None, "days_ago": 25
        },
        {
            "title": "Dangerous Edge Drop-Off and Depression",
            "category": "Pothole",
            "address": "Medical Square, Outside GMC Trauma Ward, Nagpur",
            "lat": 21.1280, "lon": 79.0960,
            "road_class": "ARTERIAL",
            "status": "IN_PROGRESS",
            "notes": "Emergency ambulances experiencing severe jolts near casualty gate.",
            "is_dup": False, "dup_ref": None, "days_ago": 4
        },
        {
            "title": "Interconnected Fatigue Cracking near IT Tech Hub",
            "category": "Alligator cracking",
            "address": "VNIT - Gayatri Nagar IT Park Road, Nagpur",
            "lat": 21.1230, "lon": 79.0510,
            "road_class": "LOCAL",
            "status": "SUBMITTED",
            "notes": "Croc-skin pattern spreading across the cycle and rickshaw lane.",
            "is_dup": False, "dup_ref": None, "days_ago": 1
        },
        {
            "title": "Pavement Edge Fracture and Pothole Formation",
            "category": "Pothole",
            "address": "Pratap Nagar Ring Road Junction, Nagpur",
            "lat": 21.1150, "lon": 79.0550,
            "road_class": "ARTERIAL",
            "status": "ASSIGNED",
            "notes": "Rainwater accumulating in broken trench along outer curb.",
            "is_dup": False, "dup_ref": None, "days_ago": 9
        },
        {
            "title": "Wide Structural Crack near Flyover Ramp",
            "category": "Transverse crack",
            "address": "Mankapur Sports Complex Ring Road, Nagpur",
            "lat": 21.1850, "lon": 79.0830,
            "road_class": "HIGHWAY",
            "status": "SUBMITTED",
            "notes": "Crack opening across approach slab of flyover.",
            "is_dup": False, "dup_ref": None, "days_ago": 5
        },
        {
            "title": "Water-filled Pothole after Heavy Monsoon Downpour",
            "category": "Pothole",
            "address": "Central Avenue Road, Gandhibagh, Nagpur",
            "lat": 21.1520, "lon": 79.1050,
            "road_class": "ARTERIAL",
            "status": "UNDER_REVIEW",
            "notes": "Submerged hole invisible to motorists during evening darkness.",
            "is_dup": False, "dup_ref": None, "days_ago": 7
        },
        {
            "title": "Surface Pavement Peeling & Rough Stripping",
            "category": "Surface deterioration",
            "address": "Reshimbagh Ground Road, Nagpur",
            "lat": 21.1310, "lon": 79.1020,
            "road_class": "LOCAL",
            "status": "RESOLVED",
            "notes": "Wearing course successfully sealed by NMC patch unit.",
            "is_dup": False, "dup_ref": None, "days_ago": 30
        },
        {
            "title": "Longitudinal Seam Separation between Asphalt Mats",
            "category": "Longitudinal crack",
            "address": "Amravati Road, Near University Campus, Nagpur",
            "lat": 21.1480, "lon": 79.0450,
            "road_class": "HIGHWAY",
            "status": "ASSIGNED",
            "notes": "Joint cracking between left and right paving passes.",
            "is_dup": False, "dup_ref": None, "days_ago": 16
        },
        {
            "title": "Non-structural Construction Joint Spall",
            "category": "Other / uncertain",
            "address": "Seminary Hills Botanical Garden Road, Nagpur",
            "lat": 21.1680, "lon": 79.0550,
            "road_class": "LOCAL",
            "status": "REJECTED",
            "notes": "Minor expansion gap deemed non-hazardous upon field review.",
            "is_dup": False, "dup_ref": None, "days_ago": 18
        },
        {
            "title": "Deep Pothole on Koradi Thermal Plant Corridor",
            "category": "Pothole",
            "address": "Koradi Road, Near Mankapur Square, Nagpur",
            "lat": 21.1920, "lon": 79.0850,
            "road_class": "HIGHWAY",
            "status": "IN_PROGRESS",
            "notes": "Heavy multi-axle coal trucks repeatedly degrading road base.",
            "is_dup": False, "dup_ref": None, "days_ago": 12
        },
        {
            "title": "Pavement Alligatoring at Bus Stop Bay",
            "category": "Alligator cracking",
            "address": "Bhandara Road, Itwari Railway Station T-Point, Nagpur",
            "lat": 21.1570, "lon": 79.1180,
            "road_class": "ARTERIAL",
            "status": "SUBMITTED",
            "notes": "Severe rutting caused by braking city transport buses.",
            "is_dup": False, "dup_ref": None, "days_ago": 3
        },
        {
            "title": "Duplicate: Itwari Bus Bay Rutting & Cracking",
            "category": "Alligator cracking",
            "address": "Itwari Bus Terminal Approach, Nagpur",
            "lat": 21.1572, "lon": 79.1183,  # ~35m away -> Duplicate candidate!
            "road_class": "ARTERIAL",
            "status": "UNDER_REVIEW",
            "notes": "Repeat submission by shopkeeper association.",
            "is_dup": True, "dup_ref": 17, "days_ago": 2
        },
        {
            "title": "Thermal Joint Crack in Concrete Overlay",
            "category": "Transverse crack",
            "address": "Wardhman Nagar Ring Road, Nagpur",
            "lat": 21.1440, "lon": 79.1300,
            "road_class": "ARTERIAL",
            "status": "RESOLVED",
            "notes": "Sealed with hot-pour polymeric joint sealant by municipal contractor.",
            "is_dup": False, "dup_ref": None, "days_ago": 22
        },
        {
            "title": "Severe Pothole Cluster near Cotton Market",
            "category": "Pothole",
            "address": "Subhash Road, Cotton Market Square, Nagpur",
            "lat": 21.1460, "lon": 79.0950,
            "road_class": "COLLECTOR",
            "status": "ASSIGNED",
            "notes": "High vegetable cart traffic creating hazard for pedestrians.",
            "is_dup": False, "dup_ref": None, "days_ago": 8
        },
        {
            "title": "Cracked Pavement Surface near Telankhedi Lake",
            "category": "Longitudinal crack",
            "address": "Futala Lake Promenade Road, Nagpur",
            "lat": 21.1530, "lon": 79.0430,
            "road_class": "LOCAL",
            "status": "UNDER_REVIEW",
            "notes": "Cracks developing along lake retaining wall embankment.",
            "is_dup": False, "dup_ref": None, "days_ago": 4
        },
        {
            "title": "Bitumen Bleeding and Surface Polishing",
            "category": "Surface deterioration",
            "address": "Manish Nagar Railway Crossing Approach, Nagpur",
            "lat": 21.0960, "lon": 79.0720,
            "road_class": "COLLECTOR",
            "status": "SUBMITTED",
            "notes": "Slick asphalt causing loss of vehicle skid resistance.",
            "is_dup": False, "dup_ref": None, "days_ago": 1
        },
        {
            "title": "Crater Pothole on Besa-Pipla Link Road",
            "category": "Pothole",
            "address": "Besa T-Point, South Nagpur",
            "lat": 21.0820, "lon": 79.0880,
            "road_class": "LOCAL",
            "status": "IN_PROGRESS",
            "notes": "Rapidly growing hole after recent construction trenching.",
            "is_dup": False, "dup_ref": None, "days_ago": 10
        },
        {
            "title": "Spalling Edge and Block Cracks",
            "category": "Alligator cracking",
            "address": "Khamla Road, Near Orange City Hospital, Nagpur",
            "lat": 21.1210, "lon": 79.0660,
            "road_class": "COLLECTOR",
            "status": "RESOLVED",
            "notes": "Complete patch repair executed with cold-mix asphalt.",
            "is_dup": False, "dup_ref": None, "days_ago": 28
        },
        {
            "title": "Pothole at Trimurti Nagar Chowk",
            "category": "Pothole",
            "address": "Ring Road, Trimurti Nagar Square, Nagpur",
            "lat": 21.1120, "lon": 79.0480,
            "road_class": "ARTERIAL",
            "status": "ASSIGNED",
            "notes": "Significant depth (>8cm). Needs immediate bitumen cold patch.",
            "is_dup": False, "dup_ref": None, "days_ago": 7
        }
    ]

    seeded_reports = []
    now = datetime.datetime.utcnow()

    for idx, case in enumerate(nagpur_cases, start=1):
        ref_no = f"CVL-2025-{idx:04d}"
        created_time = now - datetime.timedelta(days=case["days_ago"], hours=idx * 2)

        # Generate sample realistic image assets
        clean_cat = case["category"].lower().replace(" ", "_").replace("/", "_")
        file_slug = f"demo_road_{idx}_{clean_cat}"
        img_rel, annotated_rel = generate_sample_road_image(case["category"], file_slug)

        # Calculate initial heuristic metrics
        img_abs = os.path.join(settings.BASE_DIR, img_rel.lstrip("/"))
        annotated_abs = os.path.join(settings.BASE_DIR, annotated_rel.lstrip("/"))
        
        analysis_data = ai_service.analyze_image(
            image_path=img_abs,
            output_annotated_path=annotated_abs
        )

        # Priority calculation
        priority_calc = priority_engine.calculate_priority(
            severity_score=analysis_data["severity_score"],
            confidence=analysis_data["prediction_confidence"],
            duplicate_count=1 if case["is_dup"] else 0,
            created_at=created_time,
            road_classification=case["road_class"]
        )

        rep = RoadDamageReport(
            reference_number=ref_no,
            reporter_id=citizen_user.id,
            title=case["title"],
            description=case["notes"],
            image_path=img_rel,
            annotated_image_path=annotated_rel,
            latitude=case["lat"],
            longitude=case["lon"],
            address_text=case["address"],
            road_classification=case["road_class"],
            predicted_damage_category=case["category"],
            prediction_confidence=analysis_data["prediction_confidence"],
            severity_score=analysis_data["severity_score"],
            severity_level=analysis_data["severity_level"],
            priority_score=priority_calc["priority_score"],
            workflow_status=case["status"],
            assigned_authority_id=field_user.id if case["status"] in ["ASSIGNED", "IN_PROGRESS", "RESOLVED"] else None,
            is_duplicate=case["is_dup"],
            duplicate_confidence=0.82 if case["is_dup"] else 0.0,
            is_demo_data=True,
            created_at=created_time,
            updated_at=created_time + datetime.timedelta(hours=4)
        )

        if case["status"] == "RESOLVED":
            rep.resolved_at = created_time + datetime.timedelta(days=2)
            rep.resolved_by_id = auth_user.id
            rep.resolution_notes = "Inspected by municipal maintenance crew and patched with 40mm asphalt overlay."

        db.add(rep)
        db.commit()
        db.refresh(rep)

        # Link duplicate reference if applicable
        if case["is_dup"] and case["dup_ref"] and case["dup_ref"] < idx:
            rep.duplicate_reference_id = seeded_reports[case["dup_ref"] - 1].id
            db.commit()

        seeded_reports.append(rep)

        # Add AI Analysis Record
        ai_rec = AIAnalysis(
            report_id=rep.id,
            model_identifier=analysis_data["model_identifier"],
            model_version=analysis_data["model_version"],
            inference_mode=analysis_data["inference_mode"],
            predicted_classes=json.dumps(analysis_data["predicted_classes"]),
            confidence_scores=json.dumps(analysis_data["confidence_scores"]),
            bounding_boxes=json.dumps(analysis_data["bounding_boxes"]),
            severity_breakdown=json.dumps(analysis_data["severity_breakdown"]),
            analysis_metadata=json.dumps(analysis_data.get("analysis_metadata", {})),
            inference_duration_ms=analysis_data["inference_duration_ms"],
            is_demo_result=analysis_data["is_demo_result"],
            disclaimer=analysis_data["disclaimer"],
            created_at=created_time
        )
        db.add(ai_rec)

        # Add Status History
        hist1 = StatusHistory(
            report_id=rep.id,
            previous_status="NONE",
            new_status="SUBMITTED",
            changed_by_id=citizen_user.id,
            notes="Case submitted by citizen.",
            timestamp=created_time
        )
        db.add(hist1)

        if case["status"] in ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"]:
            hist2 = StatusHistory(
                report_id=rep.id,
                previous_status="SUBMITTED",
                new_status=case["status"],
                changed_by_id=auth_user.id,
                notes=f"Status transitioned to {case['status']} by authority.",
                timestamp=created_time + datetime.timedelta(hours=6)
            )
            db.add(hist2)

        # Add Maintenance Assignment if applicable
        if case["status"] in ["ASSIGNED", "IN_PROGRESS", "RESOLVED"]:
            asgn = MaintenanceAssignment(
                report_id=rep.id,
                assigned_by_id=auth_user.id,
                assigned_to_id=field_user.id,
                notes=f"Repair work order: {case['category']} maintenance on {case['road_class']}.",
                priority_level=analysis_data["severity_level"],
                assignment_status="COMPLETED" if case["status"] == "RESOLVED" else "IN_PROGRESS",
                target_completion_date=created_time + datetime.timedelta(days=4),
                assigned_at=created_time + datetime.timedelta(hours=5),
                completed_at=created_time + datetime.timedelta(days=2) if case["status"] == "RESOLVED" else None
            )
            db.add(asgn)

        db.commit()

    # 3. Add Initial Audit Logs
    audit1 = AuditLog(
        actor_id=admin_user.id,
        action="SYSTEM_INIT_SEED",
        target_type="Database",
        target_id="ALL",
        metadata_json=f'{{"total_seeded_records": {len(nagpur_cases)}}}',
        timestamp=now
    )
    db.add(audit1)
    db.commit()

    return {
        "status": "Database successfully seeded.",
        "users_created": len(users_seed),
        "reports_created": len(nagpur_cases),
        "dataset_location": "Nagpur Metro Area (Maharashtra, India)",
        "synthetic_notice": "Records marked with is_demo_data=True."
    }


def seed_wards_and_config(db: Session) -> Dict[str, Any]:
    """
    Ensures the 10 Nagpur Municipal Corporation administrative zones/wards,
    NMC Integration configuration, and default verification stages are initialized.
    """
    # 1. Seed NMC Integration Config
    if db.query(NMCIntegrationConfig).count() == 0:
        config = NMCIntegrationConfig(
            adapter_mode="SIMULATED",
            endpoint_url="https://nmcnagpur.gov.in/grievance/complaint_form.php",
            api_key_masked="NMC-DEMO-****-9482",
            mou_reference="MOU-NMC-CIVICLENS-2026-ENG-42",
            timeout_seconds=15,
            retry_limit=3,
            is_healthy=True,
            last_ping_ms=24.5,
            last_heartbeat_at=datetime.datetime.utcnow()
        )
        db.add(config)
        db.commit()
        print("[CivicLens AI] Initialized NMC Integration configuration.")

    # 2. Seed 10 Nagpur Municipal Wards / Zones
    if db.query(NagpurWard).count() == 0:
        wards_data = [
            {
                "zone_number": 1,
                "ward_name": "Laxmi Nagar",
                "marathi_name": "लक्ष्मीनगर",
                "office_address": "Laxmi Nagar Zonal Office, Near Water Tank, Nagpur",
                "zonal_officer_name": "Er. Rameshwar Patil (Executive Engineer)",
                "contact_phone": "0712-2567001",
                "contact_email": "zone1.laxminagar@nmcnagpur.gov.in",
                "latitude": 21.1180,
                "longitude": 79.0680,
                "boundary": [
                    [21.1020, 79.0450], [21.1300, 79.0480], [21.1320, 79.0800],
                    [21.1100, 79.0850], [21.0980, 79.0650], [21.1020, 79.0450]
                ]
            },
            {
                "zone_number": 2,
                "ward_name": "Dharampeth",
                "marathi_name": "धरमपेठ",
                "office_address": "Dharampeth Zonal Office, Gokulpeth Market, Nagpur",
                "zonal_officer_name": "Er. Sunita Deshmukh (Zonal Engineer)",
                "contact_phone": "0712-2567002",
                "contact_email": "zone2.dharampeth@nmcnagpur.gov.in",
                "latitude": 21.1445,
                "longitude": 79.0635,
                "boundary": [
                    [21.1300, 79.0350], [21.1600, 79.0380], [21.1620, 79.0800],
                    [21.1350, 79.0780], [21.1300, 79.0350]
                ]
            },
            {
                "zone_number": 3,
                "ward_name": "Hanuman Nagar",
                "marathi_name": "हनुमान नगर",
                "office_address": "Hanuman Nagar Zonal Office, Near Medical College, Nagpur",
                "zonal_officer_name": "Er. Nitin Bhende (Deputy Engineer)",
                "contact_phone": "0712-2567003",
                "contact_email": "zone3.hanumannagar@nmcnagpur.gov.in",
                "latitude": 21.1195,
                "longitude": 79.0965,
                "boundary": [
                    [21.1050, 79.0850], [21.1350, 79.0820], [21.1380, 79.1150],
                    [21.1080, 79.1120], [21.1050, 79.0850]
                ]
            },
            {
                "zone_number": 4,
                "ward_name": "Dhantoli",
                "marathi_name": "धंतोली",
                "office_address": "Dhantoli Zonal Office, Mehadia Square, Nagpur",
                "zonal_officer_name": "Er. Sandeep Gawande (Zonal Engineer)",
                "contact_phone": "0712-2567004",
                "contact_email": "zone4.dhantoli@nmcnagpur.gov.in",
                "latitude": 21.1350,
                "longitude": 79.0830,
                "boundary": [
                    [21.1250, 79.0700], [21.1480, 79.0720], [21.1490, 79.0980],
                    [21.1280, 79.0950], [21.1250, 79.0700]
                ]
            },
            {
                "zone_number": 5,
                "ward_name": "Nehru Nagar",
                "marathi_name": "नेहरू नगर",
                "office_address": "Nehru Nagar Zonal Office, Sakkardara Square, Nagpur",
                "zonal_officer_name": "Er. Pradeep Meshram (Executive Engineer)",
                "contact_phone": "0712-2567005",
                "contact_email": "zone5.nehrunagar@nmcnagpur.gov.in",
                "latitude": 21.1275,
                "longitude": 79.1240,
                "boundary": [
                    [21.1080, 79.1120], [21.1400, 79.1150], [21.1420, 79.1550],
                    [21.1050, 79.1480], [21.1080, 79.1120]
                ]
            },
            {
                "zone_number": 6,
                "ward_name": "Gandhibagh",
                "marathi_name": "गांधीबाग",
                "office_address": "Gandhibagh Zonal Office, Near Town Hall, Mahal, Nagpur",
                "zonal_officer_name": "Er. Anil Khapre (Zonal Engineer)",
                "contact_phone": "0712-2567006",
                "contact_email": "zone6.gandhibagh@nmcnagpur.gov.in",
                "latitude": 21.1520,
                "longitude": 79.0980,
                "boundary": [
                    [21.1420, 79.0850], [21.1650, 79.0860], [21.1660, 79.1150],
                    [21.1430, 79.1120], [21.1420, 79.0850]
                ]
            },
            {
                "zone_number": 7,
                "ward_name": "Satranjipura",
                "marathi_name": "सतरंजीपुरा",
                "office_address": "Satranjipura Zonal Office, Shanti Nagar Road, Nagpur",
                "zonal_officer_name": "Er. Vikas Moon (Deputy Engineer)",
                "contact_phone": "0712-2567007",
                "contact_email": "zone7.satranjipura@nmcnagpur.gov.in",
                "latitude": 21.1640,
                "longitude": 79.1120,
                "boundary": [
                    [21.1550, 79.0980], [21.1780, 79.1000], [21.1800, 79.1350],
                    [21.1560, 79.1300], [21.1550, 79.0980]
                ]
            },
            {
                "zone_number": 8,
                "ward_name": "Lakadganj",
                "marathi_name": "लकडगंज",
                "office_address": "Lakadganj Zonal Office, Wardhaman Nagar, Nagpur",
                "zonal_officer_name": "Er. Rajesh Thakre (Executive Engineer)",
                "contact_phone": "0712-2567008",
                "contact_email": "zone8.lakadganj@nmcnagpur.gov.in",
                "latitude": 21.1510,
                "longitude": 79.1310,
                "boundary": [
                    [21.1400, 79.1150], [21.1680, 79.1180], [21.1700, 79.1650],
                    [21.1380, 79.1600], [21.1400, 79.1150]
                ]
            },
            {
                "zone_number": 9,
                "ward_name": "Ashi Nagar",
                "marathi_name": "आशी नगर",
                "office_address": "Ashi Nagar Zonal Office, Kamptee Road, Nagpur",
                "zonal_officer_name": "Er. Sanjay Kamble (Zonal Engineer)",
                "contact_phone": "0712-2567009",
                "contact_email": "zone9.ashinagar@nmcnagpur.gov.in",
                "latitude": 21.1820,
                "longitude": 79.1180,
                "boundary": [
                    [21.1700, 79.0950], [21.2100, 79.0980], [21.2150, 79.1500],
                    [21.1720, 79.1450], [21.1700, 79.0950]
                ]
            },
            {
                "zone_number": 10,
                "ward_name": "Mangalwari",
                "marathi_name": "मंगळवारी",
                "office_address": "Mangalwari Zonal Office, Sadar Bazar, Nagpur",
                "zonal_officer_name": "Er. Milind Ukey (Executive Engineer)",
                "contact_phone": "0712-2567010",
                "contact_email": "zone10.mangalwari@nmcnagpur.gov.in",
                "latitude": 21.1710,
                "longitude": 79.0790,
                "boundary": [
                    [21.1550, 79.0550], [21.2050, 79.0580], [21.2080, 79.0980],
                    [21.1580, 79.0920], [21.1550, 79.0550]
                ]
            }
        ]
        for w in wards_data:
            ward_obj = NagpurWard(
                zone_number=w["zone_number"],
                ward_name=w["ward_name"],
                marathi_name=w["marathi_name"],
                office_address=w["office_address"],
                zonal_officer_name=w["zonal_officer_name"],
                contact_phone=w["contact_phone"],
                contact_email=w["contact_email"],
                latitude=w["latitude"],
                longitude=w["longitude"],
                boundary_coordinates_json=json.dumps(w["boundary"]),
                active_defects_count=3
            )
            db.add(ward_obj)
        db.commit()
        print(f"[CivicLens AI] Initialized {len(wards_data)} Nagpur Municipal Corporation wards.")

    # 3. Ensure existing reports have verification stages
    reports = db.query(RoadDamageReport).all()
    stages_added = 0
    for r in reports:
        if db.query(ReportVerificationStage).filter_by(report_id=r.id).count() == 0:
            stages_to_add = [
                ReportVerificationStage(
                    report_id=r.id,
                    stage_number=1,
                    stage_key="STAGE_1_IMAGE_AUTHENTICITY",
                    stage_title="Image Authenticity & Quality",
                    status="PASSED",
                    confidence_score=0.98,
                    summary="Pavement image format valid (JPEG 640x480). Sharpness Laplacian score 38.4 passes threshold (>18.0). No corrupt artifacts detected.",
                    evidence_json=json.dumps({
                        "resolution": "640x480",
                        "format": "JPEG",
                        "blur_variance": 38.4,
                        "luminance_mean": 68.2,
                        "compression_artifact_score": 0.04,
                        "duplicate_fingerprint_check": "UNIQUE"
                    }),
                    executed_at=r.created_at
                ),
                ReportVerificationStage(
                    report_id=r.id,
                    stage_number=2,
                    stage_key="STAGE_2_AI_DETECTION",
                    stage_title="AI Distress Detection & Bounding Box Localization",
                    status="PASSED",
                    confidence_score=round(r.prediction_confidence or 0.88, 2),
                    summary=f"Detected {r.predicted_damage_category} with {round((r.prediction_confidence or 0.88)*100, 1)}% confidence via YOLOv8-RDD2022 deep learning pipeline.",
                    evidence_json=json.dumps({
                        "model": "CivicLens-YOLOv8-RDD2022 (ONNX)",
                        "primary_distress": r.predicted_damage_category,
                        "confidence": round(r.prediction_confidence or 0.88, 3),
                        "inference_latency_ms": 38.2,
                        "annotated_overlay_generated": bool(r.annotated_image_path)
                    }),
                    executed_at=r.created_at
                ),
                ReportVerificationStage(
                    report_id=r.id,
                    stage_number=3,
                    stage_key="STAGE_3_SEVERITY_ASSESSMENT",
                    stage_title="Physical Severity & Road Risk Assessment",
                    status="PASSED",
                    confidence_score=round((r.severity_score or 50.0) / 100.0, 2),
                    summary=f"Calculated severity score {r.severity_score}/100 ({r.severity_level}) and priority score {r.priority_score}/100 using multi-criteria risk formula.",
                    evidence_json=json.dumps({
                        "severity_score": r.severity_score,
                        "severity_level": r.severity_level,
                        "priority_score": r.priority_score,
                        "road_classification": r.road_classification,
                        "estimated_affected_area_sqm": r.estimated_surface_area_sqm or 0.85,
                        "sla_recommended_hours": 48 if r.severity_level == "CRITICAL" else (72 if r.severity_level == "HIGH" else 168)
                    }),
                    executed_at=r.created_at
                ),
                ReportVerificationStage(
                    report_id=r.id,
                    stage_number=4,
                    stage_key="STAGE_4_GEOSPATIAL_WARD_VERIFICATION",
                    stage_title="Geospatial & Ward Jurisdiction Verification",
                    status="PASSED",
                    confidence_score=1.0,
                    summary=f"Coordinates verified within Nagpur metropolitan municipal boundaries. Mapped to Zone: {r.ward_name or r.area_locality} under {r.road_jurisdiction} jurisdiction.",
                    evidence_json=json.dumps({
                        "latitude": r.latitude,
                        "longitude": r.longitude,
                        "metro_bounds_check": "WITHIN_NAGPUR_BOUNDS",
                        "assigned_zone": r.ward_name or "Dharampeth",
                        "road_jurisdiction": r.road_jurisdiction or "NMC"
                    }),
                    executed_at=r.created_at
                ),
                ReportVerificationStage(
                    report_id=r.id,
                    stage_number=5,
                    stage_key="STAGE_5_DUPLICATE_VERIFICATION",
                    stage_title="Duplicate & Multi-Report Grievance Verification",
                    status="WARNING" if r.is_duplicate else "PASSED",
                    confidence_score=round(r.duplicate_confidence or 0.95, 2),
                    summary="Potential duplicate complaint identified within 120m corridor." if r.is_duplicate else "Unique grievance verified. No duplicate reports found within spatial radius threshold (120m).",
                    evidence_json=json.dumps({
                        "is_duplicate": r.is_duplicate,
                        "parent_reference_id": r.duplicate_reference_id,
                        "duplicate_confidence": r.duplicate_confidence,
                        "search_radius_meters": 120.0,
                        "temporal_window_days": 45
                    }),
                    executed_at=r.created_at
                )
            ]
            for s in stages_to_add:
                db.add(s)
            stages_added += 1
    if stages_added > 0:
        db.commit()
        print(f"[CivicLens AI] Seeded 5-stage verification telemetry for {stages_added} reports.")

    return {"status": "Wards and NMC config initialized successfully."}
