import os
import io
import datetime
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.models import User, RoadDamageReport
from backend.app.services.ai_service import ai_service
from backend.app.services.duplicate_service import haversine_distance, duplicate_service
from backend.app.services.priority_service import priority_engine

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
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
        "password": "Password123!",
        "role": "citizen"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email

    # Successful login
    login_res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "Password123!"})
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
    assert "overall_metrics" in lab
    assert "per_class_metrics" in lab
    assert lab["overall_metrics"]["map_50"] > 0.70
    assert len(lab["per_class_metrics"]) == 6

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


