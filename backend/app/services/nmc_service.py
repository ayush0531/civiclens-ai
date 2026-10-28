"""
CivicLens.AI — Municipal Integration & Official Handoff Service
Nagpur Municipal Corporation (NMC) & Maharashtra PWD Architecture

This module implements the integration boundary between CivicLens.AI and official
government complaint mechanisms.

OFFICIAL CHANNELS:
• Primary: Nagpur Municipal Corporation (NMC) Citizens Grievance Redressal System (CGRS)
  URL: https://nmcnagpur.gov.in/grievance/complaint_form.php
  Security Requirements: Mobile number OTP verification, session cookies, CAPTCHA.
• Secondary / Highway: Maharashtra Public Works Department (PWD) Nagpur Region
  Toll-Free Helpline: 1800 233 0080
  URL: https://pwd.maharashtra.gov.in/en/toll-free-numbers-for-registering-pothole-complaints-on-pwd-roads/

INTEGRATION STATUS ARCHITECTURE:
Because NMC requires citizen mobile verification via OTP, CivicLens operates in
"Citizen-Assisted Handoff" mode. Direct unattended API injection is not authorized
by NMC. This service strictly separates internal CivicLens records from official
government status, never claiming government acknowledgment without real verification.
"""

import datetime
from typing import Dict, Any, Optional

NMC_OFFICIAL_PORTAL_URL = "https://nmcnagpur.gov.in/grievance/complaint_form.php"
PWD_MAHARASHTRA_TOLL_FREE = "1800 233 0080"
PWD_MAHARASHTRA_URL = "https://pwd.maharashtra.gov.in/en/toll-free-numbers-for-registering-pothole-complaints-on-pwd-roads/"

# Official NMC complaint status constants
STATUS_NOT_REGISTERED = "NOT_REGISTERED"
STATUS_CITIZEN_REPORTED_UNVERIFIED = "CITIZEN_REPORTED_UNVERIFIED"
STATUS_OFFICIAL_REFERENCE_RECORDED = "OFFICIAL_REFERENCE_RECORDED"
STATUS_STATUS_VERIFIED = "STATUS_VERIFIED"
STATUS_RESOLUTION_VERIFIED = "RESOLUTION_VERIFIED"

OFFICIAL_STATUS_LABELS: Dict[str, str] = {
    "NOT_REGISTERED": "Not yet registered through NMC",
    "CITIZEN_REPORTED_UNVERIFIED": "Registration reported by citizen — unverified",
    "OFFICIAL_REFERENCE_RECORDED": "Official reference recorded",
    "STATUS_VERIFIED": "Status verified through an authorized integration",
    "RESOLUTION_VERIFIED": "Resolution verified through an authorized integration",
    "DEMO_ENVIRONMENT": "Demonstration environment"
}

CIVICLENS_INTERNAL_STATUS_LABELS: Dict[str, str] = {
    "SAVED": "Saved within CivicLens",
    "SUBMITTED": "Saved within CivicLens",
    "AWAITING_OFFICIAL_REGISTRATION": "Awaiting official registration",
    "OFFICIAL_REFERENCE_RECORDED": "Official reference recorded by citizen",
    "MONITORING": "Monitoring",
    "UNDER_REVIEW": "Under Review (Simulated Demonstration Workflow)",
    "ACTION_PLANNED": "Action Planned (Simulated Demonstration Workflow)",
    "ASSIGNED": "Assigned (Simulated Demonstration Workflow)",
    "IN_PROGRESS": "In Progress (Simulated Demonstration Workflow)",
    "RESOLVED": "Closed within CivicLens (Simulated Demonstration Workflow)",
    "CLOSED_INTERNAL": "Closed within CivicLens",
    "REJECTED": "Rejected within CivicLens"
}


class NMCIntegrationService:
    """
    Interface for real-world Nagpur Municipal Corporation handoff and future direct API connection.
    """
    OFFICIAL_PORTAL_URL = NMC_OFFICIAL_PORTAL_URL
    PWD_TOLL_FREE_NUMBER = PWD_MAHARASHTRA_TOLL_FREE
    PWD_OFFICIAL_URL = PWD_MAHARASHTRA_URL
    OFFICIAL_STATUS_LABELS = OFFICIAL_STATUS_LABELS
    INTERNAL_STATUS_LABELS = CIVICLENS_INTERNAL_STATUS_LABELS

    def get_official_portal_url(self) -> str:
        return NMC_OFFICIAL_PORTAL_URL

    def get_pwd_helpline(self) -> Dict[str, str]:
        return {
            "toll_free_number": PWD_MAHARASHTRA_TOLL_FREE,
            "official_url": PWD_MAHARASHTRA_URL,
            "region": "Nagpur Regional Division (Maharashtra PWD)",
            "guidance": "For state highways, major district roads (MDR), and PWD corridors in Nagpur."
        }

    def format_complaint_summary(self, report: Any) -> str:
        """
        Generates a structured, clean text summary of a CivicLens complaint
        for the citizen to copy or download. Strictly excludes sensitive passwords or auth tokens.
        """
        created_str = (
            report.created_at.strftime("%d %b %Y, %I:%M %p")
            if hasattr(report.created_at, "strftime")
            else str(report.created_at)
        )
        incident_date_str = (
            report.incident_date.strftime("%d %b %Y")
            if getattr(report, "incident_date", None) and hasattr(report.incident_date, "strftime")
            else "Not specified"
        )
        lat = getattr(report, "latitude", 0.0)
        lon = getattr(report, "longitude", 0.0)

        lines = [
            "============================================================",
            " CIVICLENS.AI — ROAD DEFECT COMPLAINT SUMMARY",
            "============================================================",
            f"CivicLens Internal Reference ID : {report.reference_number}",
            f"Date Recorded in CivicLens      : {created_str}",
            f"Incident Observation Date       : {incident_date_str}",
            "",
            "1. DEFECT & LOCATION INFORMATION",
            "------------------------------------------------------------",
            f"Complaint Title     : {report.title}",
            f"City Jurisdiction   : {getattr(report, 'city', 'Nagpur')}, Maharashtra",
            f"Locality / Zone     : {getattr(report, 'area_locality', 'Nagpur Central')}",
            f"Prominent Landmark  : {getattr(report, 'landmark', None) or getattr(report, 'address_text', 'Not specified')}",
            f"Street Address      : {getattr(report, 'address_text', 'Nagpur')}",
            f"GPS Coordinates     : {lat:.6f}°N, {lon:.6f}°E",
            f"Road Classification : {getattr(report, 'road_classification', 'LOCAL')}",
            f"Target Authority    : {getattr(report, 'road_jurisdiction', 'NMC')}",
            "",
            "2. CITIZEN DESCRIPTION",
            "------------------------------------------------------------",
            f"{getattr(report, 'description', '') or 'No additional description provided.'}",
            "",
            "3. CIVICLENS AI TELEMETRY (PRELIMINARY SCAN)",
            "------------------------------------------------------------",
            f"Distress Classification : {getattr(report, 'predicted_damage_category', 'Unanalyzed')}",
            f"AI Model Confidence     : {getattr(report, 'prediction_confidence', 0.0)*100:.1f}%",
            f"Physical Severity Index : {getattr(report, 'severity_score', 0.0):.1f}/100 ({getattr(report, 'severity_level', 'PENDING')})",
            f"Calculated Priority     : {getattr(report, 'priority_score', 0.0):.1f}/100",
            "",
            "4. OFFICIAL NMC SUBMISSION INSTRUCTIONS",
            "------------------------------------------------------------",
            "1. Open the official NMC Grievance Portal:",
            f"   {NMC_OFFICIAL_PORTAL_URL}",
            "2. Complete mobile OTP verification as required by NMC.",
            "3. Paste or enter the Location, Landmark, and Description above.",
            "4. Upload your road defect photograph.",
            "5. Submit and copy your official NMC complaint number.",
            "6. Return to CivicLens.AI and click 'Save Official Reference' to link both records.",
            "",
            "5. ALTERNATIVE HIGHWAY CONTACTS (PWD)",
            "------------------------------------------------------------",
            "If this road is a State Highway or PWD corridor, use Maharashtra PWD Toll-Free:",
            f"Toll-Free Phone : {PWD_MAHARASHTRA_TOLL_FREE}",
            f"Official Link   : {PWD_MAHARASHTRA_URL}",
            "============================================================"
        ]
        return "\n".join(lines)

    def get_authorized_integration_spec(self) -> Dict[str, Any]:
        """
        Technical specification describing requirements for a future direct NMC API integration.
        """
        return {
            "current_mode": "CITIZEN_HANDOFF",
            "is_direct_api_active": False,
            "reason": (
                "Nagpur Municipal Corporation's online grievance portal utilizes citizen mobile OTP "
                "verification and does not publish an open public submission API. Direct automated injection "
                "without an authorized institutional MOU would violate portal terms of service and security controls."
            ),
            "requirements_for_real_integration": [
                "Official Memorandum of Understanding (MOU) between project entity and NMC / NSSCDCL (Nagpur Smart City).",
                "Dedicated API Gateway endpoint (e.g. https://api.nmcnagpur.gov.in/v1/grievance/intake).",
                "mTLS / OAuth2 client credentials with IP whitelisting.",
                "Citizen explicit consent token compliant with Digital Personal Data Protection (DPDP) Act 2023.",
                "Secure Webhook receiver for real-time status callbacks (e.g. ASSIGNED, INSPECTED, RESOLVED)."
            ],
            "official_portal_url": NMC_OFFICIAL_PORTAL_URL,
            "pwd_helpline": PWD_MAHARASHTRA_TOLL_FREE
        }


nmc_service = NMCIntegrationService()
