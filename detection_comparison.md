# CivicLens AI — Detection Comparison Report (Before vs. After)

**Target Image:** `backend/uploads/demo_road_2_pothole.jpg` (Resolution: 640 × 480 px)  
**Evaluation Date:** November 22, 2026  
**Artifacts Generated:**
- `before_predictions.json`
- `after_predictions.json`
- `before_annotated.jpg`
- `after_annotated.jpg`

---

## 1. Visual & Quantitative Comparison

| Metric / Parameter | Before Fix | After Fix | Resolution / Impact |
|---|---|---|---|
| **Detected Pothole Count** | **2** (Fragmented) | **1** (Unified) | Single physical continuous crater now mapped to exactly 1 detection. |
| **Primary Damage Category** | `Pothole` | `Pothole` | Maintained accurate defect classification. |
| **Primary Confidence** | 79% | 79% | Ground-truth confidence preserved. |
| **Bounding Boxes Generated** | Box 1: `[296, 263, 160, 112]`<br>Box 2: `[231, 296, 33, 79]` | **Box 1:** `[231, 263, 225, 112]` | Sub-features united across the 32px aggregate gap. Full pothole covered. |
| **Estimated Length (cm)** | 31.2 cm | **43.9 cm** | More realistic dimension estimate covering full span. |
| **Estimated Width (cm)** | 21.9 cm | **21.9 cm** | Preserved vertical span. |
| **Estimated Area ($m^2$)** | 0.054 $m^2$ | **0.075 $m^2$** | Comprehensive area calculation including both lobes. |
| **Large Pothole (>35% Area)** | **0 detections** ("Other / uncertain") | **1 detection** (Pothole, 87%) | Fixed `area_pct` and `horizon_perspective` drop rules. |
| **Frontend Fallback UI** | Showed hardcoded `85%` when 0 detected | Shows `0%` / actual score | Removed `{confidence ? ... : '85%'}` fallback bug. |

---

## 2. Raw Model Predictions Comparison

### Raw Predictions Before Fix (`before_predictions.json`)
```json
{
  "detected_pothole_count": 2,
  "predicted_damage_category": "Pothole",
  "prediction_confidence": 0.79,
  "bounding_boxes": [
    {
      "x": 296,
      "y": 263,
      "width": 160,
      "height": 112,
      "label": "Pothole",
      "confidence": 0.79,
      "area_pct": 4.52
    },
    {
      "x": 231,
      "y": 296,
      "width": 33,
      "height": 79,
      "label": "Pothole",
      "confidence": 0.66,
      "area_pct": 0.42
    }
  ]
}
```

### Raw Predictions After Fix (`after_predictions.json`)
```json
{
  "detected_pothole_count": 1,
  "predicted_damage_category": "Pothole",
  "prediction_confidence": 0.79,
  "bounding_boxes": [
    {
      "x": 231,
      "y": 263,
      "width": 225,
      "height": 112,
      "label": "Pothole",
      "confidence": 0.79,
      "area_pct": 4.94
    }
  ],
  "potholes_breakdown": [
    {
      "index": 1,
      "label": "Pothole",
      "pixel_dimensions": "225 × 112 px",
      "estimated_length_cm": 43.9,
      "estimated_width_cm": 21.9,
      "estimated_area_sqm": 0.075,
      "damage_level": "High",
      "confidence_pct": 79,
      "bounding_box": {
        "x": 231,
        "y": 263,
        "width": 225,
        "height": 112
      }
    }
  ]
}
```

---

## 3. Systematic Test Matrix Results

| Test Case | Description & Content | Expected Output | Actual Output | Status |
|---|---|---|---|---|
| **Test 1** | One Large Physical Pothole (`demo_road_2_pothole.jpg`) | 1 Pothole Detection | **1 Pothole** (`[231, 263, 225, 112]`, 79% conf) | **PASS** |
| **Test 2** | Two Separate Potholes (`two_potholes.jpg`) | 2 Distinct Detections | **2 Potholes** (Separate bounding boxes) | **PASS** |
| **Test 3** | Three Separate Potholes (`test_3_potholes.jpg`) | 3 Distinct Detections | **3 Potholes** (Separate bounding boxes) | **PASS** |
| **Test 4** | Five Separate Potholes (`five_potholes.jpg`) | 5 Distinct Detections | **5 Potholes** (Separate bounding boxes) | **PASS** |
| **Test 5** | Normal Road Surface (`test_clean_road_lane.jpg`) | 0 Potholes Detected | **0 Potholes** (Road Verified, no defects) | **PASS** |
| **Test 6** | Road with Cars & Trees (`test_cars_trees.jpg`) | 0 False Potholes | **0 Potholes** (Vehicles/trees rejected) | **PASS** |
| **Test 7** | Person / Selfie Portrait (`test_selfie.jpg`) | Non-road Image Rejection | **REJECTED** (`is_road_scene: false`) | **PASS** |

---

## 4. Summary of Output Artifacts

- **`before_predictions.json`:** Direct output of raw model and pipeline state prior to merging enhancements.
- **`after_predictions.json`:** Verified output of corrected unified detection pipeline.
- **`before_annotated.jpg`:** Rendered image showing the split bounding boxes before the fix.
- **`after_annotated.jpg`:** Rendered image showing the single unified bounding box covering the entire physical crater.
