import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="citizen", nullable=False)  # citizen, authority, admin
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    reports = relationship("RoadDamageReport", back_populates="reporter", foreign_keys="RoadDamageReport.reporter_id")
    assigned_reports = relationship("RoadDamageReport", back_populates="assigned_authority", foreign_keys="RoadDamageReport.assigned_authority_id")
    assignments_created = relationship("MaintenanceAssignment", back_populates="assigned_by", foreign_keys="MaintenanceAssignment.assigned_by_id")
    assignments_received = relationship("MaintenanceAssignment", back_populates="assigned_to", foreign_keys="MaintenanceAssignment.assigned_to_id")
    status_changes = relationship("StatusHistory", back_populates="changed_by")
    audit_logs = relationship("AuditLog", back_populates="actor")
    feedbacks = relationship("Feedback", back_populates="user")


class RoadDamageReport(Base):
    __tablename__ = "road_damage_reports"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(40), unique=True, index=True, nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Media paths (relative to backend or URL)
    image_path = Column(String(500), nullable=False)
    annotated_image_path = Column(String(500), nullable=True)
    
    # Geographic location
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address_text = Column(String(255), nullable=True)
    landmark = Column(String(200), nullable=True)
    area_locality = Column(String(100), default="Nagpur Central", nullable=True)
    city = Column(String(100), default="Nagpur", nullable=True)
    road_classification = Column(String(50), default="LOCAL")  # HIGHWAY, ARTERIAL, COLLECTOR, LOCAL
    
    # Optional Citizen Contact Info (Protected from Public Display)
    reporter_name = Column(String(120), nullable=True)
    reporter_contact = Column(String(100), nullable=True)
    incident_date = Column(DateTime, nullable=True)

    # Municipal Integration State (NMC Demonstration)
    external_submission_status = Column(String(60), default="DEMO_ENVIRONMENT", nullable=False)
    external_reference_id = Column(String(100), nullable=True)
    
    # AI Prediction & Severity
    predicted_damage_category = Column(String(80), default="Unanalyzed")
    prediction_confidence = Column(Float, default=0.0)
    severity_score = Column(Float, default=0.0)  # 0 to 100
    severity_level = Column(String(20), default="PENDING")  # LOW, MEDIUM, HIGH, CRITICAL, PENDING
    priority_score = Column(Float, default=0.0)  # 0 to 100 (Explainable multi-factor)
    
    # Lifecycle Workflow
    workflow_status = Column(String(30), default="SUBMITTED", index=True)
    # SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED / REJECTED
    
    assigned_authority_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Duplicate Management
    duplicate_reference_id = Column(Integer, ForeignKey("road_damage_reports.id"), nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_confidence = Column(Float, default=0.0)
    
    # Resolution details
    resolution_notes = Column(Text, nullable=True)
    resolution_image_path = Column(String(500), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Demo / Synthetic indicator
    is_demo_data = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assigned_authority = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_authority_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    duplicate_parent = relationship("RoadDamageReport", remote_side=[id], backref="child_duplicates")
    
    analyses = relationship("AIAnalysis", back_populates="report", cascade="all, delete-orphan")
    assignments = relationship("MaintenanceAssignment", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="report", cascade="all, delete-orphan", order_by="StatusHistory.timestamp.asc()")
    feedbacks = relationship("Feedback", back_populates="report", cascade="all, delete-orphan")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("road_damage_reports.id"), nullable=False, index=True)
    model_identifier = Column(String(120), nullable=False)
    model_version = Column(String(30), nullable=False)
    inference_mode = Column(String(30), default="DEMO")  # "DEMO" or "REAL"
    
    # JSON strings for detection details
    predicted_classes = Column(Text, nullable=False)  # JSON list
    confidence_scores = Column(Text, nullable=False)  # JSON list
    bounding_boxes = Column(Text, nullable=False)     # JSON list of [x, y, w, h, label, score]
    severity_breakdown = Column(Text, nullable=False) # JSON obj with weights and components
    analysis_metadata = Column(Text, nullable=True)   # JSON extra debug data
    
    inference_duration_ms = Column(Float, default=0.0)
    is_demo_result = Column(Boolean, default=True)
    disclaimer = Column(String(255), default="DEMO ANALYSIS — NOT A VALIDATED AI PREDICTION")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationship
    report = relationship("RoadDamageReport", back_populates="analyses")


class MaintenanceAssignment(Base):
    __tablename__ = "maintenance_assignments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("road_damage_reports.id"), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    priority_level = Column(String(30), default="MEDIUM")
    assignment_status = Column(String(30), default="PENDING")  # PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    target_completion_date = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    report = relationship("RoadDamageReport", back_populates="assignments")
    assigned_by = relationship("User", back_populates="assignments_created", foreign_keys=[assigned_by_id])
    assigned_to = relationship("User", back_populates="assignments_received", foreign_keys=[assigned_to_id])


class StatusHistory(Base):
    __tablename__ = "status_histories"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("road_damage_reports.id"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    report = relationship("RoadDamageReport", back_populates="status_history")
    changed_by = relationship("User", back_populates="status_changes")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    metadata_json = Column(Text, nullable=True)
    ip_address = Column(String(60), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)

    # Relationship
    actor = relationship("User", back_populates="audit_logs")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("road_damage_reports.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    feedback_type = Column(String(50), default="SATISFACTION")
    rating = Column(Integer, default=5)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    report = relationship("RoadDamageReport", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")
