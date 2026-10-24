# CivicLens AI: Intelligent Road Damage Detection and Maintenance Prioritization System
## Final-Year Engineering Project Proposal (B.Tech Artificial Intelligence)

---

### 1. Project Metadata
* **Project Title:** CivicLens AI — Intelligent Road Damage Detection and Maintenance Prioritization System
* **Department:** Department of Artificial Intelligence & Data Science / Computer Technology
* **Academic Year:** 2024–2025 (Final Year Capstone Evaluation)
* **Domain:** Computer Vision, Geographic Information Systems (GIS), Municipal Infrastructure Decision Support
* **Target Pilot Region:** Nagpur Metro Urban Region (Maharashtra, India)

---

### 2. Executive Summary
Urban road infrastructure maintenance in developing metropolises like Nagpur is chronically impaired by reactive, subjective, and redundant grievance reporting. Citizens submit unstandardized complaints lacking severity metrics, while municipal engineers face backlogs inundated with spatial duplicate reports.

**CivicLens AI** is an end-to-end civic engineering platform that automates the road distress lifecycle:
1. **Intelligent Intake:** Captures georeferenced smartphone images with metadata.
2. **Computer Vision Inference:** Classifies distress into standardized municipal taxonomies (potholes, transverse, longitudinal, and alligator cracks, surface deterioration) with bounding box localization.
3. **Physical Severity Estimation:** Formulates an explainable severity metric derived from defect area coverage and distress multipliers.
4. **Spatial & Visual Duplicate Detection:** Filters duplicate complaints using Haversine geographic radius and 64-bit difference hashing (dHash).
5. **Multi-Criteria Maintenance Prioritization:** Orders work orders based on distress severity, citizen repeat signals, aging delays, and roadway classification hierarchies.

---

### 3. Problem Statement & Research Motivation
* **Pavement Deterioration vs Traffic Safety:** Unrepaired potholes and severe alligator cracking directly contribute to road vehicular accidents, two-wheeler skids, and transit delays.
* **Lack of Objective Defect Quantification:** Municipal road inspections rely on manual visual patrols. Ordinary complaints lack objective metrics (area, type, danger index).
* **Duplicate Congestion in Grievance Portals:** A single severe pothole on high-density corridors (e.g., Sitabuldi or Wardha Road) frequently receives dozens of independent citizen tickets, distorting workload estimates.
* **Equitable Resource Allocation:** Municipal road budgets are constrained. Without an algorithmic, explainable priority ranking model, repair dispatch often favors administrative convenience over critical engineering necessity.

---

### 4. Objectives of the Work
1. **Develop an Accessible Web Portal:** Provide citizen and authority interfaces for image submission, geolocation tagging, and case tracking.
2. **Implement Modular Computer Vision Detection:** Deploy an inference service supporting both real deep learning detectors and transparent deterministic heuristic baselines.
3. **Formulate Explainable Mathematical Models:**
   * Pavement Severity Index ($0 \le S \le 100$).
   * Municipal Maintenance Priority Score ($0 \le P \le 100$).
4. **Deploy Geospatial Duplicate Filtering:** Combine spatial radius indexing ($< 120\text{ m}$) with perceptual image hashing to identify concurrent tickets.
5. **Deliver Enterprise-Grade Role-Based Governance:** Provide discrete, server-enforced privileges for Citizens, Municipal Authorities, and Administrators with comprehensive audit logging.

---

### 5. Scope & Boundary Conditions
* **Target Distress Classes:** Pothole, Alligator cracking, Transverse crack, Longitudinal crack, Surface deterioration, and Other/uncertain.
* **Geospatial Scope:** Validated with synthetic and field coordinates across key urban transit hubs of Nagpur, India.
* **Decision Support Boundary:** The system produces advisory priority recommendations to support municipal human supervisors. It explicitly does not initiate autonomous physical road repair machinery without engineering sign-off.
* **Photogrammetric Boundary:** Ordinary 2D smartphone photographs are evaluated for relative surface area and morphology. Absolute depth in millimeters is recognized as physically unmeasurable without stereoscopic photogrammetry or active LiDAR sensors.

---

### 6. Expected Engineering Contributions
1. **Unified Civic Architecture:** A robust, tested full-stack software application with a clean separation of concerns between FastAPI REST APIs and a modern React/Tailwind frontend.
2. **Transparent AI Heuristics:** Open mathematical explanations behind every generated severity and priority score, countering the "black-box" dilemma in municipal technology.
3. **Deduplication Engine:** A scalable hybrid spatial-visual deduplication pipeline reducing municipal backlog overhead.
4. **Reproducible Academic Testbed:** Documented test suites, reproducible seeding fixtures, and thesis-ready evaluation protocols.
