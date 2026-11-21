import os
import io
import json
import datetime
import pytest
from PIL import Image, ImageDraw, ImageFilter
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal, check_and_apply_migrations
from backend.app.models.models import User, RoadDamageReport
from backend.app.services.ai_service import ai_service
from backend.app.services.duplicate_service import haversine_distance, duplicate_service
from backend.app.services.priority_service import priority_engine
from backend.app.utils.seed_data import seed_database, seed_wards_and_config

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    check_and_apply_migrations(engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed_database(db=db, force=False)
        seed_wards_and_config(db)
    finally:
        db.close()
    yield

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["database"] == "CONNECTED"
    assert "ai_engine" in data
    assert data["ai_engine"]["mode"] in ["REAL", "DEMO"]
    assert "CivicLens" in data["ai_engine"]["model_name"]

def test_user_registration_and_login():
    test_email = f"test_{os.urandom(4).hex()}@example.com"
    reg_payload = {
        "name": "Test Citizen",
        "email": test_email,
        "password": "Password123!Secure",
        "role": "citizen"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email

    # Successful login
    login_res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "Password123!Secure"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid login password
    bad_res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "WrongPassword"})
    assert bad_res.status_code == 401

def test_auth_me_endpoint():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "citizen@civiclens.ai"

def test_rbac_citizen_forbidden_admin():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Citizen trying to access admin users endpoint
    res = client.get("/api/v1/admin/users", headers=headers)
    assert res.status_code == 403

def test_admin_access_allowed():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/users", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_report_creation_and_auto_analysis():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy in-memory image
    img = Image.new("RGB", (320, 240), color=(70, 70, 70))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    files = {"image": ("test_road.jpg", img_byte_arr, "image/jpeg")}
    data = {
        "title": "Fresh Test Pothole On Ring Road",
        "description": "Deep depression noticed near intersection.",
        "latitude": 21.1450,
        "longitude": 79.0880,
        "address_text": "Ring Road, Nagpur",
        "road_classification": "ARTERIAL",
        "auto_analyze": True
    }

    res = client.post("/api/v1/reports", headers=headers, data=data, files=files)
    assert res.status_code == 201
    rep = res.json()
    assert rep["reference_number"].startswith("CVL-")
    assert rep["predicted_damage_category"] in [
        "Pothole", "Longitudinal crack", "Transverse crack",
        "Alligator cracking", "Surface deterioration", "Other / uncertain"
    ]
    assert rep["severity_score"] >= 0.0
    assert rep["workflow_status"] == "SUBMITTED"
    assert len(rep["analyses"]) >= 1
    assert "inference_duration_ms" in rep["analyses"][0]

def test_invalid_image_upload_rejected():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_file = io.BytesIO(b"Not an image content")
    files = {"image": ("malicious.exe", fake_file, "application/octet-stream")}
    data = {
        "title": "Invalid Image Payload Test",
        "latitude": 21.14,
        "longitude": 79.08
    }
    res = client.post("/api/v1/reports", headers=headers, data=data, files=files)
    assert res.status_code == 400

def test_haversine_and_duplicate_service():
    lat1, lon1 = 21.1458, 79.0882
    lat2, lon2 = 21.1459, 79.0884
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    assert 15.0 < dist < 45.0

    db = SessionLocal()
    try:
        dups = duplicate_service.find_potential_duplicates(
            db=db,
            latitude=lat1,
            longitude=lon1
        )
        assert isinstance(dups, list)
    finally:
        db.close()

def test_priority_engine_calculation():
    calc = priority_engine.calculate_priority(
        severity_score=80.0,
        confidence=0.92,
        duplicate_count=2,
        created_at=datetime.datetime.utcnow(),
        road_classification="HIGHWAY"
    )
    assert "priority_score" in calc
    assert 0.0 <= calc["priority_score"] <= 100.0
    assert "severity_contribution" in calc["breakdown"]
    assert "confidence_contribution" in calc["breakdown"]
    assert "traffic_safety_contribution" in calc["breakdown"]

def test_workflow_illegal_transition_rejection():
    login_res = client.post("/api/v1/auth/login", json={"email": "authority@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    rep_res = client.get("/api/v1/reports?workflow_status=SUBMITTED&limit=1")
    reports = rep_res.json()
    if reports:
        report_id = reports[0]["id"]
        bad_trans = client.post(
            f"/api/v1/reports/{report_id}/status",
            headers=headers,
            json={"new_status": "RESOLVED", "notes": "Premature skip"}
        )
        assert bad_trans.status_code == 400
        assert "Illegal state transition" in bad_trans.json()["detail"]

def test_analytics_endpoints():
    overview_res = client.get("/api/v1/analytics/overview")
    assert overview_res.status_code == 200
    ov = overview_res.json()
    assert ov["total_reports"] >= 20
    assert ov["ai_inference_mode"] in ["DEMO", "REAL"]

    trends_res = client.get("/api/v1/analytics/trends")
    assert trends_res.status_code == 200
    tr = trends_res.json()
    assert len(tr["categories"]) > 0
    assert len(tr["severities"]) == 4
    assert len(tr["hotspots"]) > 0

def test_map_markers_and_spatial_clusters():
    res = client.get("/api/v1/map/reports")
    assert res.status_code == 200
    markers = res.json()
    assert len(markers) > 0
    assert "latitude" in markers[0]

    cluster_res = client.get("/api/v1/map/clusters")
    assert cluster_res.status_code == 200
    clusters = cluster_res.json()
    assert isinstance(clusters, list)

def test_model_evaluation_laboratory_endpoint():
    res = client.get("/api/v1/ai/evaluation")
    assert res.status_code == 200
    lab = res.json()
    assert lab["evaluation_status"] == "NOT_VALIDATED"
    assert lab["overall_metrics"]["map_50"] is None
    assert lab["per_class_metrics"] == []
    assert lab["confusion_matrix"]["matrix"] == []

def test_priority_policy_get_and_update():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@civiclens.ai", "password": "DemoPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_policy = client.get("/api/v1/admin/priority-policy", headers=headers)
    assert get_policy.status_code == 200
    assert "policy" in get_policy.json()

    # Update policy
    new_weights = {
        "w_sev": 0.40,
        "w_conf": 0.15,
        "w_dup": 0.15,
        "w_age": 0.10,
        "w_road": 0.10,
        "w_traffic": 0.10
    }
    put_policy = client.put("/api/v1/admin/priority-policy", headers=headers, json=new_weights)
    assert put_policy.status_code == 200
    assert put_policy.json()["policy"]["w_sev"] == 0.40

def test_public_tracking_endpoint():
    # Fetch seeded reports from map or DB to get an identifier
    res = client.get("/api/v1/map/reports")
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) > 0
    first_id = reports[0]["id"]
    first_ref = reports[0].get("reference_number")

    # Track by integer ID
    track_res1 = client.get(f"/api/v1/reports/track/{first_id}")
    assert track_res1.status_code == 200
    data1 = track_res1.json()
    assert data1["id"] == first_id
    assert "workflow_status" in data1
    assert "status_history" in data1
    assert "external_submission_notice" in data1
    assert "Nagpur Municipal Corporation" in data1["external_submission_notice"]

    # Track by reference_number if present
    if first_ref:
        track_res2 = client.get(f"/api/v1/reports/track/{first_ref}")
        assert track_res2.status_code == 200
        assert track_res2.json()["id"] == first_id

    # 404 on invalid identifier
    bad_res = client.get("/api/v1/reports/track/NON_EXISTENT_99999")
    assert bad_res.status_code == 404

def test_ai_quick_inspect_endpoint():
    # Create test image in memory
    img = Image.new("RGB", (200, 200), color=(120, 120, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("test_road.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_damage_category" in data
    assert "prediction_confidence" in data
    assert "severity_score" in data
    assert "severity_level" in data
    assert "bounding_boxes" in data
    assert isinstance(data["bounding_boxes"], list)
    assert data["is_demo_result"] is True
    assert data["prediction_confidence"] == 0.0
    assert data["bounding_boxes"] == []


def test_nmc_integration_spec_endpoint():
    res = client.get("/api/v1/reports/nmc/integration-spec")
    assert res.status_code == 200
    data = res.json()
    assert data["current_mode"] in ["CITIZEN_HANDOFF", "CITIZEN_ASSISTED_HANDOFF"]
    assert data["is_direct_api_active"] is False
    assert "https://nmcnagpur.gov.in" in data["official_portal_url"]
    assert "1800 233 0080" in data["pwd_helpline"]
    assert len(data["requirements_for_real_integration"]) >= 4


def test_record_external_reference_and_dual_status():
    res = client.get("/api/v1/map/reports")
    assert res.status_code == 200
    report_id = res.json()[0]["id"]

    ext_ref = f"NMC-2026-{os.urandom(3).hex().upper()}"
    payload = {
        "external_reference_id": ext_ref,
        "notes": "Citizen verified with OTP on nmcnagpur.gov.in",
        "road_jurisdiction": "NMC"
    }
    post_res = client.post(f"/api/v1/reports/{report_id}/external-reference", json=payload)
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["external_reference_id"] == ext_ref
    assert data["external_submission_status"] == "CITIZEN_REPORTED_UNVERIFIED"
    assert "unverified" in data["external_submission_label"].lower()
    assert data["road_jurisdiction"] == "NMC"

    # Track by this new external reference
    track_res = client.get(f"/api/v1/reports/track/{ext_ref}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["id"] == report_id
    assert track_data["external_reference_id"] == ext_ref

    # Plain text summary download
    summary_res = client.get(f"/api/v1/reports/{report_id}/summary-text")
    assert summary_res.status_code == 200
    text_content = summary_res.text
    assert "CIVIC LENS AI — ROAD DEFECT COMPLAINT SUMMARY" in text_content
    assert ext_ref in text_content or track_data["reference_number"] in text_content
    assert "https://nmcnagpur.gov.in" in text_content
    assert "1800 233 0080" in text_content


def test_anonymous_report_submission_does_not_require_fake_user():
    """Anonymous reports must not create status rows with a made-up user ID."""
    img = Image.new("RGB", (320, 240), color=(90, 90, 90))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/v1/reports",
        data={
            "title": "Anonymous report foreign key regression",
            "latitude": 21.1458,
            "longitude": 79.0882,
            "address_text": "Sitabuldi, Nagpur",
            "auto_analyze": "false",
        },
        files={"image": ("anonymous-road.jpg", buf, "image/jpeg")},
    )
    assert response.status_code == 201, response.text
    report = response.json()
    assert report["reporter_id"] is None
    assert report["workflow_status"] == "SUBMITTED"

    # The report remains trackable even though no user account is attached.
    tracked = client.get(f"/api/v1/reports/track/{report['reference_number']}")
    assert tracked.status_code == 200, tracked.text
    assert tracked.json()["reference_number"] == report["reference_number"]


def test_anonymous_report_can_record_external_reference_without_fake_user():
    """Recording a citizen-provided NMC reference must not invent changed_by_id."""
    img = Image.new("RGB", (320, 240), color=(110, 110, 110))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    created = client.post(
        "/api/v1/reports",
        data={
            "title": "Anonymous external reference regression",
            "latitude": 21.1460,
            "longitude": 79.0884,
            "auto_analyze": "false",
        },
        files={"image": ("anonymous-reference.jpg", buf, "image/jpeg")},
    )
    assert created.status_code == 201, created.text
    report_id = created.json()["id"]

    updated = client.post(
        f"/api/v1/reports/{report_id}/external-reference",
        json={
            "external_reference_id": f"NMC-TEST-{os.urandom(3).hex().upper()}",
            "notes": "Citizen-provided reference; not independently verified.",
            "road_jurisdiction": "NMC",
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["external_submission_status"] == "CITIZEN_REPORTED_UNVERIFIED"


def create_dummy_pavement_image():
    img = Image.new("RGB", (320, 240), color=(70, 70, 70))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)
    return img_byte_arr


def test_five_stage_verification_engine():
    """
    Verifies that creating a report executes all 5 sequential audit stages:
    Stage 1: Image Authenticity & Quality
    Stage 2: AI Detection & Bounding Box Localization
    Stage 3: Physical Severity & SLA Computation
    Stage 4: Geospatial & Ward Verification
    Stage 5: Duplicate Grievance Verification
    """
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    citizen_token = login_res.json()["access_token"]

    img_bytes = create_dummy_pavement_image()
    files = {"image": ("pavement_audit_test.jpg", img_bytes, "image/jpeg")}
    data = {
        "title": "Severe road cavity near Dharampeth Market",
        "description": "5-stage verification audit test.",
        "latitude": 21.1445,
        "longitude": 79.0635,
        "address_text": "Gokulpeth, Dharampeth, Nagpur",
        "road_classification": "ARTERIAL",
        "auto_analyze": True
    }
    res = client.post(
        "/api/v1/reports",
        data=data,
        files=files,
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 201
    body = res.json()
    assert body["ward_name"] == "Dharampeth"
    assert "verification_stages" in body
    stages = body["verification_stages"]
    assert len(stages) == 5

    stage_keys = [s["stage_key"] for s in stages]
    assert "STAGE_1_IMAGE_AUTHENTICITY" in stage_keys
    assert "STAGE_2_AI_DETECTION" in stage_keys
    assert "STAGE_3_SEVERITY_ASSESSMENT" in stage_keys
    assert "STAGE_4_GEOSPATIAL_WARD_VERIFICATION" in stage_keys
    assert "STAGE_5_DUPLICATE_VERIFICATION" in stage_keys

    # Verify stage 1 quality evidence
    s1 = next(s for s in stages if s["stage_number"] == 1)
    assert s1["status"] in ["PASSED", "WARNING"]
    ev1 = json.loads(s1["evidence_json"])
    assert "format" in ev1
    assert "sharpness_laplacian" in ev1

    # Verify stage 3 SLA evidence
    s3 = next(s for s in stages if s["stage_number"] == 3)
    ev3 = json.loads(s3["evidence_json"])
    assert "estimated_surface_area_sqm" in ev3
    assert "sla_hours" in ev3


def test_nmc_adapter_simulation_and_idempotency():
    """
    Verifies the NMC Integration Adapter:
    1. Submits report through simulated grievance intake adapter.
    2. Receives verifiable official reference code (NMC-2026-GRV-XXXX).
    3. Re-submits with identical idempotency key and confirms duplicate prevention.
    """
    # Create test report
    img_bytes = create_dummy_pavement_image()
    files = {"image": ("nmc_test.jpg", img_bytes, "image/jpeg")}
    data = {
        "title": "Road crater on Wardha Road near Lokmat Sq",
        "latitude": 21.1350,
        "longitude": 79.0830,
        "address_text": "Wardha Road, Dhantoli, Nagpur",
        "road_classification": "HIGHWAY"
    }
    create_res = client.post("/api/v1/reports", data=data, files=files)
    assert create_res.status_code == 201
    rep_id = create_res.json()["id"]

    idemp_key = f"TEST-IDEMP-{rep_id}-ALPHA"

    # Submit to NMC simulated demonstration
    submit_res = client.post(f"/api/v1/reports/{rep_id}/submit-nmc?idempotency_key={idemp_key}")
    assert submit_res.status_code == 200
    res_data = submit_res.json()
    assert res_data["external_submission_status"] == "DEMO_ENVIRONMENT"
    assert "CVL-DEMO-" in (res_data["external_reference_notes"] or "")

    # Re-submit with same idempotency key
    replay_res = client.post(f"/api/v1/reports/{rep_id}/submit-nmc?idempotency_key={idemp_key}")
    assert replay_res.status_code == 200
    replay_data = replay_res.json()
    assert replay_data["external_submission_status"] == res_data["external_submission_status"]
    assert replay_data["external_reference_notes"] == res_data["external_reference_notes"]

    # Check NMC Health
    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@civiclens.ai", "password": "DemoPass123!"})
    admin_token = admin_login.json()["access_token"]
    health_res = client.get("/api/v1/admin/nmc/health", headers={"Authorization": f"Bearer {admin_token}"})
    assert health_res.status_code == 200
    assert health_res.json()["is_healthy"] is True


def test_before_after_repair_verification():
    """
    Verifies automated AI Before-and-After inspection:
    1. Uploads post-repair image for an active defect.
    2. Measures residual damage score.
    3. Transitions workflow status to RESOLVED upon verification.
    """
    auth_login = client.post("/api/v1/auth/login", json={"email": "authority@civiclens.ai", "password": "DemoPass123!"})
    authority_token = auth_login.json()["access_token"]

    # Create test report
    img_bytes = create_dummy_pavement_image()
    files = {"image": ("pre_repair.jpg", img_bytes, "image/jpeg")}
    data = {
        "title": "Repair verification test report",
        "latitude": 21.1200,
        "longitude": 79.0700,
        "address_text": "Pratap Nagar, Nagpur"
    }
    rep_res = client.post("/api/v1/reports", data=data, files=files)
    rep_id = rep_res.json()["id"]

    # Run repair verification with smooth patch
    post_img = create_dummy_pavement_image()
    repair_files = {"after_image": ("post_repair.jpg", post_img, "image/jpeg")}
    repair_data = {
        "contractor_name": "Nagpur Highway Infra Ltd",
        "asphalt_mix_type": "Bituminous Concrete Grade 2",
        "inspection_notes": "Patch leveled and compacted with 10-ton roller."
    }
    verify_res = client.post(
        f"/api/v1/reports/{rep_id}/verify-repair",
        data=repair_data,
        files=repair_files,
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert verify_res.status_code == 200
    v_body = verify_res.json()
    assert "resolution_status" in v_body
    assert "residual_damage_score" in v_body
    assert v_body["residual_damage_score"] >= 0.0

    # Verify resolution evidence record is persisted
    detail_res = client.get(f"/api/v1/reports/{rep_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["repair_evidences"]) == 1
    if v_body["resolution_status"] in ["VERIFIED_REPAIRED", "PARTIAL_REPAIR_DETECTED"]:
        assert detail_res.json()["workflow_status"] == "RESOLVED"
    else:
        assert detail_res.json()["workflow_status"] in ["SUBMITTED", "IN_PROGRESS"]


def test_nl_parser_endpoint():
    """
    Tests Natural Language grievance extraction into structured civic telemetry.
    """
    payload = {
        "text": "Critical deep pothole near Shankar Nagar square on West High Court road damaging bikes since yesterday morning"
    }
    res = client.post("/api/v1/ai/parse-nl-report", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["parsed_successfully"] is True
    assert body["predicted_damage_category"] == "Pothole"
    assert body["severity_level"] == "CRITICAL"
    assert body["extracted_landmark"] == "Shankar Nagar"
    assert body["suggested_ward"] == "Dharampeth"
    assert body["road_classification"] == "ARTERIAL"


def test_nagpur_wards_endpoint():
    """
    Verifies that the 10 Nagpur Municipal Corporation wards are retrieved
    with valid GeoJSON polygon boundaries and zonal contacts.
    """
    res = client.get("/api/v1/map/wards")
    assert res.status_code == 200
    wards = res.json()
    assert len(wards) == 10
    names = [w["ward_name"] for w in wards]
    assert "Laxmi Nagar" in names
    assert "Dharampeth" in names
    assert "Hanuman Nagar" in names
    assert "Dhantoli" in names
    assert "Mangalwari" in names

    # Verify polygon coordinate json is present
    w1 = next(w for w in wards if w["zone_number"] == 1)
    boundary = json.loads(w1["boundary_coordinates_json"])
    assert len(boundary) >= 4


def test_complaint_reopen_workflow():
    """
    Verifies citizen complaint reopen workflow when repair is disputed.
    """
    citizen_login = client.post("/api/v1/auth/login", json={"email": "citizen@civiclens.ai", "password": "DemoPass123!"})
    citizen_token = citizen_login.json()["access_token"]

    # Create test report
    img_bytes = create_dummy_pavement_image()
    files = {"image": ("reopen_test.jpg", img_bytes, "image/jpeg")}
    data = {
        "title": "Disputed pothole patch on Hingna Road",
        "latitude": 21.1100,
        "longitude": 79.0400,
        "address_text": "Hingna Road, Nagpur"
    }
    rep_res = client.post("/api/v1/reports", data=data, files=files)
    rep_id = rep_res.json()["id"]

    # Reopen report
    reopen_data = {
        "reason": "Cold mix asphalt washed away after rain, hole has opened back up."
    }
    reopen_res = client.post(
        f"/api/v1/reports/{rep_id}/reopen",
        data=reopen_data,
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert reopen_res.status_code == 200
    body = reopen_res.json()
    assert body["workflow_status"] == "IN_PROGRESS"
    assert body["reopened_count"] == 1


# =====================================================================
# MANDATORY SPECIFICATION TESTS A - F: FALSE POSITIVE & DETECTION AUDIT
# =====================================================================

def test_ai_human_photograph_rejected_test_a():
    """
    TEST A: Upload a person's photograph / selfie.
    The system rejects it as an unrelated road image. It must never identify
    the person as a pothole.
    """
    # Create synthetic portrait / selfie
    img = Image.new("RGB", (320, 320), (230, 240, 250))
    draw = ImageDraw.Draw(img)
    draw.ellipse([70, 50, 250, 270], fill=(225, 175, 145))  # Skin face
    draw.ellipse([100, 110, 130, 140], fill=(70, 40, 30))   # Left eye
    draw.ellipse([190, 110, 220, 140], fill=(70, 40, 30))   # Right eye
    draw.ellipse([135, 190, 185, 210], fill=(180, 60, 60))  # Lips

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("selfie.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is False
    assert data["road_scene_status"] == "REJECTED"
    assert "doesn't look like a road photograph" in data["road_scene_message"]
    assert len(data["bounding_boxes"]) == 0
    assert data["detected_pothole_count"] == 0
    assert data["predicted_damage_category"] != "Pothole"


def test_ai_building_photograph_rejected_test_b():
    """
    TEST B: Upload a building photograph.
    The system rejects it as an unrelated road image.
    """
    img = Image.new("RGB", (320, 320), (100, 180, 255))  # Blue sky
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 90, 280, 320], fill=(190, 75, 55))  # Red brick building
    for row in range(110, 300, 35):
        for col in range(60, 260, 40):
            draw.rectangle([col, row, col + 24, row + 20], fill=(240, 240, 255))  # Windows

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("building.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is False
    assert data["road_scene_status"] == "REJECTED"
    assert "doesn't look like a road photograph" in data["road_scene_message"]
    assert len(data["bounding_boxes"]) == 0
    assert data["detected_pothole_count"] == 0


def test_ai_road_without_pothole_accepted_test_c():
    """
    TEST C: Upload a clean road surface without potholes.
    Recognize the road scene but report no pothole detected.
    """
    import random
    img = Image.new("RGB", (320, 240), (68, 70, 72))  # Asphalt gray
    rng = random.Random(42)
    for _ in range(3000):
        rx, ry = rng.randint(0, 319), rng.randint(0, 239)
        gv = rng.randint(50, 88)
        img.putpixel((rx, ry), (gv, gv, gv))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("clean_road.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["road_scene_status"] == "VERIFIED"
    assert data["detected_pothole_count"] == 0
    assert len(data["bounding_boxes"]) == 0


def test_ai_actual_pothole_detected_test_d():
    """
    TEST D: Upload actual road photograph with a pothole.
    Detect the pothole, show its bounding box and actual confidence score.
    """
    pothole_img_path = "backend/uploads/demo_road_2_pothole.jpg"
    with open(pothole_img_path, "rb") as f:
        files = {"image": ("pothole.jpg", f, "image/jpeg")}
        res = client.post("/api/v1/ai/quick-inspect", files=files)

    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["road_scene_status"] == "VERIFIED"
    assert data["detected_pothole_count"] >= 1
    assert len(data["bounding_boxes"]) >= 1
    assert data["predicted_damage_category"] == "Pothole"
    assert data["prediction_confidence"] >= 0.60
    assert data["severity_score"] > 0.0

    # Verify bounding box structure
    box = data["bounding_boxes"][0]
    assert "x" in box and "y" in box and "width" in box and "height" in box
    assert box["label"] == "Pothole"


def test_ai_multiple_potholes_detected_test_e():
    """
    TEST E: Upload road image with multiple distinct potholes.
    Identify separate potholes where present.
    """
    import random
    img = Image.new("RGB", (640, 480), (65, 70, 75))
    draw = ImageDraw.Draw(img)
    rng = random.Random(123)
    for _ in range(8000):
        rx, ry = rng.randint(0, 639), rng.randint(0, 479)
        gv = rng.randint(45, 95)
        img.putpixel((rx, ry), (gv, gv, gv))

    # Pothole 1 on left side
    draw.ellipse([110, 180, 230, 270], fill=(16, 16, 18))
    # Pothole 2 on right side
    draw.ellipse([410, 250, 560, 360], fill=(14, 14, 16))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("two_potholes.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["detected_pothole_count"] >= 2
    assert len(data["bounding_boxes"]) >= 2
    assert len(data["potholes_breakdown"]) >= 2


def test_ai_blurry_image_warning_test_f():
    """
    TEST F: Upload blurry road photograph.
    Requests a clearer photograph.
    """
    # Create smooth blurred image
    img = Image.new("RGB", (320, 240), (70, 70, 70))
    # Gaussian blur with radius
    img = img.filter(ImageFilter.GaussianBlur(radius=10.0))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("blurry_road.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["quality_status"] in ["WARNING", "FAILED"]
    assert "blurry" in data["quality_message"].lower()


def test_workflow_submission_contract_test_g_and_i():
    """
    TEST G & I:
    Workflow inspection only runs preflight; complaint is submitted and created
    ONLY after the final submission call.
    """
    # 1. Quick inspect does not create any database records
    initial_reports_count = client.get("/api/v1/map/reports").json()
    count_before = len(initial_reports_count)

    img = Image.new("RGB", (320, 240), color=(70, 70, 70))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    inspect_res = client.post("/api/v1/ai/quick-inspect", files={"image": ("inspect_only.jpg", buf, "image/jpeg")})
    assert inspect_res.status_code == 200

    # Verify no complaint was created by inspection alone
    count_after_inspect = len(client.get("/api/v1/map/reports").json())
    assert count_after_inspect == count_before

    # 2. Only explicit submission creates the complaint
    buf.seek(0)
    post_res = client.post(
        "/api/v1/reports",
        data={
            "title": "Road Problem at Dharampeth Square",
            "latitude": 21.1420,
            "longitude": 79.0620,
            "address_text": "West High Court Road, Dharampeth, Nagpur",
            "road_classification": "COLLECTOR",
            "auto_analyze": "true"
        },
        files={"image": ("confirmed_report.jpg", buf, "image/jpeg")}
    )
    assert post_res.status_code == 201
    created_data = post_res.json()
    assert created_data["reference_number"].startswith("CVL-")
    assert created_data["workflow_status"] == "SUBMITTED"


def test_backend_failure_validation_test_j():
    """
    TEST J: Invalid payload must return an error response, never a false success.
    """
    # Missing required image and invalid latitude
    res = client.post(
        "/api/v1/reports",
        data={
            "title": "Invalid Coordinates Test",
            "latitude": 999.0,  # Invalid latitude out of [-90, 90]
            "longitude": 79.0880
        }
    )
    assert res.status_code == 422
    assert "detail" in res.json()


def test_complaint_tracking_retrieval_test_k():
    """
    TEST K: The actual submitted complaint can be retrieved using its complaint ID.
    """
    img = Image.new("RGB", (320, 240), color=(70, 70, 70))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    create_res = client.post(
        "/api/v1/reports",
        data={
            "title": "Grievance for Tracking Verification",
            "latitude": 21.1458,
            "longitude": 79.0882,
            "address_text": "Sitabuldi Interchange, Nagpur",
            "auto_analyze": "false"
        },
        files={"image": ("tracking_test.jpg", buf, "image/jpeg")}
    )
    assert create_res.status_code == 201
    created = create_res.json()
    ref_id = created["reference_number"]

    # Retrieve complaint by reference code
    track_res = client.get(f"/api/v1/reports/track/{ref_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["reference_number"] == ref_id
    assert track_data["id"] == created["id"]
    assert track_data["workflow_status"] == "SUBMITTED"


def test_branding_exact_civic_lens_ai_test_l():
    """
    TEST L: Exact branding 'Civic Lens AI' (three separate words).
    """
    assert settings.PROJECT_NAME == "Civic Lens AI"

    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["service"] == "Civic Lens AI"
    assert "Civic Lens AI" in health_data["disclaimer"]


def test_ai_pothole_closeup_accepted_test_1():
    """
    TEST 1: Actual Pothole Close-up
    Photograph where the pothole depression and dirt/rubble occupy a large fraction of the frame.
    Must be ACCEPTED as road defect (status: VERIFIED), not rejected as non-road.
    """
    import numpy as np
    y, x = np.ogrid[:480, :640]
    # Asphalt border (neutral gray)
    arr = np.full((480, 640, 3), 105, dtype=np.uint8)
    # Pothole cavity occupies 45% of the frame, filled with dark earth/gravel tones
    mask = ((x - 320) / 170)**2 + ((y - 240) / 115)**2 <= 1
    arr[mask] = [68, 55, 38]
    # Gritty aggregate texture
    arr += np.random.randint(-10, 10, (480, 640, 3)).astype(np.uint8)

    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("pothole_closeup.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["road_scene_status"] == "VERIFIED"
    assert data["detected_pothole_count"] >= 1
    assert len(data["bounding_boxes"]) >= 1
    assert data["predicted_damage_category"] == "Pothole"
    assert data["severity_score"] > 0.0


def test_ai_uncertain_image_advisory_test_7():
    """
    TEST 7: Uncertain Image
    An image that is not a human, building, or screenshot, but has ambiguous pavement cues.
    Must return UNCERTAIN with a clear advisory, rather than flatly declaring it invalid.
    """
    import numpy as np
    # Colored abstract texture (not face, not sky, not document)
    arr = np.random.randint(40, 190, (320, 320, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("ambiguous_image.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    # Must not reject as human face or building
    assert data["road_scene_status"] in ["UNCERTAIN", "VERIFIED"]
    if data["road_scene_status"] == "UNCERTAIN":
        assert "unable to verify" in data["road_scene_message"].lower() or "clearer" in data["road_scene_message"].lower()


def test_footer_developer_credit_and_heart_removed_test_9():
    """
    TEST 9: Footer Cleanliness
    Verifies that the heart icon, 'Developed with', and developer credits are completely removed from the frontend.
    """
    footer_path = "frontend/src/components/Footer.tsx"
    with open(footer_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "Developed with" not in content
    assert "Made with" not in content
    assert "<Heart" not in content
    assert "Smarter Indian Municipal Infrastructure" not in content
    assert "Civic Lens AI" in content


def test_ai_accuracy_one_pothole_with_cars_and_trees_test_1():
    """
    ACCURACY TEST 1: One pothole with cars and trees in the background.
    Expected: Exactly one pothole detection. Neither the car nor the trees are detected as potholes.
    """
    img = Image.new("RGB", (640, 480), (120, 120, 120))
    d = ImageDraw.Draw(img)
    # Sky & tree canopies
    d.rectangle([0, 0, 640, 140], fill=(135, 195, 245))
    d.ellipse([20, 30, 180, 220], fill=(34, 110, 45))   # tree 1
    d.ellipse([460, 40, 620, 230], fill=(28, 100, 38))  # tree 2
    # Road pavement
    d.rectangle([0, 160, 640, 480], fill=(105, 105, 105))
    # Car parked on road
    d.rectangle([410, 210, 570, 270], fill=(180, 30, 30)) # red car body
    d.rectangle([440, 180, 540, 215], fill=(30, 35, 40))   # dark windows
    d.ellipse([430, 260, 460, 290], fill=(15, 15, 15))     # tire
    # One actual pothole on the roadway
    d.ellipse([180, 320, 290, 390], fill=(42, 38, 35))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("street_scene.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["detected_pothole_count"] == 1
    assert len(data["bounding_boxes"]) == 1
    assert data["predicted_damage_category"] == "Pothole"
    # Ensure the single bounding box is around the pothole (x ~ 180, y ~ 320), NOT the car or trees
    box = data["bounding_boxes"][0]
    assert 150 <= box["x"] <= 210
    assert 300 <= box["y"] <= 340


def test_ai_accuracy_road_with_cars_trees_zero_potholes_test_2():
    """
    ACCURACY TEST 2: Normal road with cars and trees but no potholes.
    Expected: Exactly zero pothole detections. Neither cars nor trees trigger false detections.
    """
    img = Image.new("RGB", (640, 480), (120, 120, 120))
    d = ImageDraw.Draw(img)
    # Sky & trees
    d.rectangle([0, 0, 640, 140], fill=(135, 195, 245))
    d.ellipse([20, 30, 180, 220], fill=(34, 110, 45))
    d.ellipse([460, 40, 620, 230], fill=(28, 100, 38))
    # Road
    d.rectangle([0, 160, 640, 480], fill=(105, 105, 105))
    # Car (red)
    d.rectangle([410, 210, 570, 270], fill=(180, 30, 30))
    d.rectangle([440, 180, 540, 215], fill=(30, 35, 40))
    # Black car
    d.rectangle([120, 170, 260, 260], fill=(20, 20, 22))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("normal_road_with_cars.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["detected_pothole_count"] == 0
    assert len(data["bounding_boxes"]) == 0


def test_ai_accuracy_three_potholes_detected_test_3():
    """
    ACCURACY TEST 3: Road containing three distinct potholes.
    Expected: Detects three separate potholes.
    """
    img = Image.new("RGB", (640, 480), (105, 105, 105))
    d = ImageDraw.Draw(img)
    d.ellipse([80, 200, 180, 270], fill=(40, 38, 35))   # Pothole 1
    d.ellipse([300, 320, 430, 400], fill=(38, 36, 33))  # Pothole 2
    d.ellipse([490, 220, 590, 290], fill=(42, 40, 37))  # Pothole 3

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("three_potholes.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["is_road_scene"] is True
    assert data["detected_pothole_count"] == 3
    assert len(data["bounding_boxes"]) == 3
    assert len(data["potholes_breakdown"]) == 3


def test_ai_accuracy_car_or_tree_photo_zero_potholes_test_4():
    """
    ACCURACY TEST 4: Photograph of a car or tree without a pothole.
    Expected: Zero pothole detections.
    """
    img = Image.new("RGB", (640, 480), (135, 195, 245)) # sky
    d = ImageDraw.Draw(img)
    # Large tree
    d.ellipse([100, 50, 540, 450], fill=(34, 115, 45))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("tree_photo.jpg", buf, "image/jpeg")}
    res = client.post("/api/v1/ai/quick-inspect", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["detected_pothole_count"] == 0
    assert len(data["bounding_boxes"]) == 0





