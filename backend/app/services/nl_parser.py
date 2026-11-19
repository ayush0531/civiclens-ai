"""
CivicLens AI — Natural Language Road Defect Grievance Parser
Extracts structured civic engineering fields from citizen conversational descriptions.

Capabilities:
- Distress classification mapping (Pothole, Crack, Surface deterioration)
- Severity and urgency level inference from descriptive keywords
- Road hierarchy detection (Highway, Arterial, Collector, Local)
- Nagpur Landmark and Locality entity recognition (e.g. Sitabuldi, Shankar Nagar, Dharampeth, Medical Sq)
- Structured complaint title synthesis
"""

import re
from typing import Dict, Any, List, Optional

# Nagpur geographical entity knowledge base
NAGPUR_LOCALITIES = [
    ("Dharampeth", "Dharampeth", "ARTERIAL"),
    ("Shankar Nagar", "Dharampeth", "ARTERIAL"),
    ("Gokulpeth", "Dharampeth", "LOCAL"),
    ("Ram Nagar", "Dharampeth", "COLLECTOR"),
    ("Civil Lines", "Dharampeth", "ARTERIAL"),
    ("Sitabuldi", "Dhantoli", "ARTERIAL"),
    ("Dhantoli", "Dhantoli", "COLLECTOR"),
    ("Congress Nagar", "Dhantoli", "COLLECTOR"),
    ("Rahate Colony", "Dhantoli", "ARTERIAL"),
    ("Laxmi Nagar", "Laxmi Nagar", "ARTERIAL"),
    ("Bajaj Nagar", "Laxmi Nagar", "COLLECTOR"),
    ("Pratap Nagar", "Laxmi Nagar", "ARTERIAL"),
    ("Khamla", "Laxmi Nagar", "COLLECTOR"),
    ("Medical Square", "Hanuman Nagar", "ARTERIAL"),
    ("Hanuman Nagar", "Hanuman Nagar", "COLLECTOR"),
    ("Reshimbagh", "Hanuman Nagar", "COLLECTOR"),
    ("Sakkardara", "Nehru Nagar", "ARTERIAL"),
    ("Nehru Nagar", "Nehru Nagar", "COLLECTOR"),
    ("Nandanvan", "Nehru Nagar", "ARTERIAL"),
    ("Mahal", "Gandhibagh", "LOCAL"),
    ("Gandhibagh", "Gandhibagh", "LOCAL"),
    ("Itwari", "Satranjipura", "ARTERIAL"),
    ("Shanti Nagar", "Satranjipura", "LOCAL"),
    ("Satranjipura", "Satranjipura", "LOCAL"),
    ("Lakadganj", "Lakadganj", "COLLECTOR"),
    ("Wardhaman Nagar", "Lakadganj", "ARTERIAL"),
    ("Automotive Square", "Ashi Nagar", "HIGHWAY"),
    ("Kamptee Road", "Ashi Nagar", "HIGHWAY"),
    ("Ashi Nagar", "Ashi Nagar", "LOCAL"),
    ("Sadar", "Mangalwari", "ARTERIAL"),
    ("Mankapur", "Mangalwari", "HIGHWAY"),
    ("Koradi Road", "Mangalwari", "HIGHWAY"),
    ("Wardha Road", "Dhantoli", "HIGHWAY"),
    ("Hingna Road", "Laxmi Nagar", "ARTERIAL"),
    ("Ring Road", "Laxmi Nagar", "ARTERIAL"),
    ("Amravati Road", "Dharampeth", "HIGHWAY"),
    ("West High Court Road", "Dharampeth", "ARTERIAL"),
    ("WHC Road", "Dharampeth", "ARTERIAL")
]

# Distress keywords mapping
DEFECT_KEYWORDS = [
    (r"\b(pothole|potholes|pit|crater|hole|khadda|khadde)\b", "Pothole", 1.0),
    (r"\b(alligator|web|mesh|shattered|mosaic)\b", "Alligator cracking", 0.85),
    (r"\b(transverse|horizontal crack|fissure across)\b", "Transverse crack", 0.70),
    (r"\b(longitudinal|vertical crack|crack along|line crack)\b", "Longitudinal crack", 0.65),
    (r"\b(surface|deterioration|rough|uneven|peeling|eroded|raveling|loose gravel)\b", "Surface deterioration", 0.50),
    (r"\b(crack|cracked|cracks)\b", "Transverse crack", 0.65)
]

# Severity indicator terms
SEVERITY_INDICATORS = [
    (r"\b(huge|deep|critical|emergency|severe|dangerous|accident|fatal|broken axle|wheel damaged|two-wheeler fall)\b", "CRITICAL", 85.0),
    (r"\b(bad|large|big|hazardous|heavy traffic|major|damaging)\b", "HIGH", 65.0),
    (r"\b(medium|moderate|growing|bumpy|annoying)\b", "MEDIUM", 45.0),
    (r"\b(minor|small|slight|hairline|surface|starting)\b", "LOW", 25.0)
]

class NaturalLanguageGrievanceParser:
    """
    Parses unstructured text descriptions into validated complaint metadata.
    """

    def parse_description(self, text: str) -> Dict[str, Any]:
        if not text or len(text.strip()) < 5:
            return {
                "parsed_successfully": False,
                "message": "Input text too brief to extract road grievance entities."
            }

        cleaned = text.strip()
        lower_text = cleaned.lower()

        # 1. Identify Defect Category
        detected_category = "Pothole"  # default
        category_confidence = 0.60
        for pattern, cat, conf in DEFECT_KEYWORDS:
            if re.search(pattern, lower_text):
                detected_category = cat
                category_confidence = conf
                break

        # 2. Identify Severity Level
        detected_severity = "MEDIUM"
        severity_score = 50.0
        for pattern, sev_level, score in SEVERITY_INDICATORS:
            if re.search(pattern, lower_text):
                detected_severity = sev_level
                severity_score = score
                break

        # 3. Identify Locality & Ward
        detected_landmark = None
        detected_ward = "Dharampeth"
        road_class = "LOCAL"
        for loc, ward, rclass in NAGPUR_LOCALITIES:
            if loc.lower() in lower_text:
                detected_landmark = loc
                detected_ward = ward
                road_class = rclass
                break

        # 4. Generate structured Title
        if detected_landmark:
            title = f"{detected_category} observed near {detected_landmark}"
        else:
            title = f"Reported {detected_category} on municipal road"

        return {
            "parsed_successfully": True,
            "structured_title": title,
            "suggested_title": title,
            "predicted_damage_category": detected_category,
            "distress_type": detected_category,
            "category_confidence": round(category_confidence, 2),
            "severity_level": detected_severity,
            "suggested_severity": detected_severity,
            "estimated_severity_score": severity_score,
            "road_classification": road_class,
            "suggested_ward": detected_ward,
            "ward_name": detected_ward,
            "extracted_landmark": detected_landmark,
            "landmark": detected_landmark,
            "summary": title,
            "urgency_level": "IMMEDIATE" if detected_severity == "CRITICAL" else ("ELEVATED" if detected_severity == "HIGH" else "STANDARD"),
            "extracted_from_input": cleaned[:120] + "..." if len(cleaned) > 120 else cleaned
        }

nl_parser = NaturalLanguageGrievanceParser()
