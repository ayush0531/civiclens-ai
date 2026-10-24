# CivicLens AI: Live College Evaluation & Presentation Guide

---

## 1. Quick Startup Commands

To start the complete system for the college evaluation presentation:

### Option A: Standard Full-Stack Startup (Recommended)
Open two terminal tabs:

**Terminal Tab 1 (Backend API):**
```bash
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API & Swagger UI: `http://localhost:8000/docs`

**Terminal Tab 2 (Frontend Client):**
```bash
cd frontend && npm run dev
```
* Frontend Application: `http://localhost:5173`

---

### Option B: Single-Command Production Mode
Since the frontend production bundle is compiled into `frontend/dist`, you can run everything on a single port:
```bash
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
* Access full application and API at: `http://localhost:8000`

---

## 2. Standard Demo Credentials

For live evaluation, use the convenient **Demo Switcher** dropdown in the top navbar, or manually sign in:

| Role | Email | Password | Primary Demonstration Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen Reporter** | `citizen@civiclens.ai` | `DemoPass123!` | Report defects, inspect AI analysis, track my tickets |
| **Municipal Authority** | `authority@civiclens.ai` | `DemoPass123!` | Prioritized triage queue, assign crew, mark resolved with proof |
| **System Admin** | `admin@civiclens.ai` | `DemoPass123!` | User role governance, system health diagnostics, 1-click reseed |
| **Field Supervisor** | `engineer@civiclens.ai` | `DemoPass123!` | Field maintenance work orders & repair execution |

---

## 3. Step-by-Step Evaluator Presentation Script (5-Minute Walkthrough)

### Minute 1: The Problem & The Solution
1. Open the landing page (`http://localhost:5173`).
2. *Script to say:*  
   > "Good morning, respected professors and external examiners. Urban road grievance systems fail because citizen complaints lack objective quantification and create massive duplicate backlogs. **CivicLens AI** is an intelligent civic infrastructure platform that uses computer vision to detect asphalt distress, estimates physical severity through explainable formulas, eliminates spatial duplicates, and ranks municipal maintenance queues."
3. Highlight the live KPI cards showing Nagpur pilot statistics derived from actual database queries.

### Minute 2: Citizen Intake & Instant AI Analysis
1. Click **Report Road Damage** in the navbar.
2. Click one of the quick **Nagpur Presets** (e.g. *Sitabuldi Interchange* or *Wardha Road*). Notice how the interactive map pin and coordinates update automatically.
3. Select an image file (or any image). Leave **Auto-Execute AI Analysis Pipeline** checked.
4. Click **Submit Damage Report**.
5. *Script to say:*  
   > "Upon submission, our backend runs image morphology analysis, draws annotated bounding boxes, and calculates an explainable severity score. Notice the transparent disclaimer: in this demonstration environment, heuristic metrics are explicitly labeled, preserving academic integrity."

### Minute 3: Explainable Multi-Criteria Priority Engine
1. Point to the **Multi-Criteria Priority Ranking Breakdown** on the case page.
2. *Script to say:*  
   > "Unlike black-box systems, we compute a 5-factor priority score: 40% physical severity, 20% detection confidence, 15% duplicate signal, 15% aging delay penalty, and 10% road classification. We also display a research baseline comparison showing how multi-criteria prioritization shifts cases compared to raw severity alone."
3. Highlight the **Duplicate Candidate Alert** showing nearby complaints within 120 meters.

### Minute 4: Municipal Operations & Case Resolution
1. Use the **Demo Switcher** in the navbar and select **Municipal Authority**.
2. Navigate to **Authority Triage**.
3. Point out the prioritized queue ordered by priority score descending.
4. Click **Manage** on a case:
   * Click **Assign Field Maintenance Crew**, select Supervisor *Vikram Deshmukh*, and click confirm.
   * Click **Resolve Case with Proof**, enter completion notes, and attach a resolution photo.
5. Show how the status history and cryptographic audit log immutably record the transition.

### Minute 5: Interactive Map & Recharts Analytics
1. Open **Damage Map** in the navbar:
   * Show 25 geocoded markers across Nagpur (Sitabuldi, Dharampeth, Sadar, Wardha Road).
   * Filter by category (e.g., *Pothole*) or severity (*Critical*).
   * Click a pin to show the interactive case slide-over.
2. Open **Analytics**:
   * Show Recharts category distribution, severity donut chart, and monthly intake throughput.
   * Show the Nagpur Geographic Hotspots table ranking zones by defect density.
3. Open **Admin**:
   * Show user role management and click **Reseed Nagpur Demo Records** to demonstrate instant reproducible database resets.

---

## 4. Key Questions Examiners Might Ask & How to Answer

* **Q: Did you train your own YOLO model?**  
  * **Answer:** *"Our inference service is designed with a pluggable dual-mode architecture. When custom weights are loaded, it runs real object detection. In this prototype demonstration, we implemented an honest deterministic computer vision heuristic engine using image morphology, and we explicitly label it to ensure total academic honesty."*
* **Q: Can you measure pothole depth from a phone photo?**  
  * **Answer:** *"No, ordinary 2D monocular images lack physical depth without stereoscopic cameras, LiDAR, or known ground calibration targets. CivicLens AI explicitly avoids claiming millimeter depth measurements and focuses on relative defect area coverage and surface distress multipliers."*
* **Q: How does duplicate detection work?**  
  * **Answer:** *"We use a two-stage filter: first, a spatial pre-filter using the Haversine great-circle formula for reports within 120 meters; second, a 64-bit difference hash (dHash) comparing perceptual image luminance gradients to prevent duplicate contractor dispatches."*
