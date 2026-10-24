# CivicLens AI: Thesis Experimentation & Research Evaluation Protocol

---

## 1. Research Questions (RQ)

* **RQ1 (Object Detection Performance):** Can lightweight edge-deployable deep learning architectures (e.g. YOLOv8-Nano / MobileNetV4) achieve real-time road damage detection with $\text{mAP@0.5} \ge 0.65$ on Indian urban pavement datasets?
* **RQ2 (Deduplication Precision):** To what extent does combining Haversine spatial radius with 64-bit perceptual hashing reduce false-positive duplicate citizen complaints compared to spatial distance alone?
* **RQ3 (Multi-Criteria Prioritization Alignment):** Does the multi-factor priority ranking engine correlate more strongly with expert civil engineers' manual triage decisions than a naive severity-only baseline?

---

## 2. Dataset Selection & Partitioning

### Primary Target Datasets:
1. **RDD2022 (India Subset):** Sourced from the IEEE BigData Global Road Damage Detection Challenge. Contains over 13,000 car/smartphone dashcam images collected on Indian national highways and urban roads across Delhi and Bengaluru with annotations for `D00`, `D10`, `D20`, and `D40`.
2. **Nagpur Urban Field Dataset (Local Pilot):** 1,500 locally collected smartphone photographs capturing Nagpur metro corridors (Sitabuldi, Sadar, Dharampeth, Wardha Road, Central Avenue, Besa).

### Data Split Strategy:
To guarantee unbiased generalization, data is partitioned strictly by geographic corridor (spatial cross-validation) rather than random frame shuffle to avoid contiguous video frame leakage:

| Split Partition | Percentage | Intended Purpose |
| :--- | :--- | :--- |
| **Training Set** | 70% | Feature representation learning & backbone fine-tuning |
| **Validation Set** | 15% | Hyperparameter optimization & early stopping |
| **Testing Set** | 15% | Final unbiased reporting on unseen urban corridors |

---

## 3. Evaluation Metrics & Baselines

### 3.1 Object Detection Metrics
* **Precision ($P$):** $\frac{\text{TP}}{\text{TP} + \text{FP}}$
* **Recall ($R$):** $\frac{\text{TP}}{\text{TP} + \text{FN}}$
* **mAP@0.5:** Mean Average Precision at IoU threshold of 0.50.
* **mAP@0.5:0.95:** COCO primary metric evaluated across IoU thresholds from 0.50 to 0.95 (step 0.05).
* **Inference Latency ($\tau$):** Milliseconds elapsed per $640\times480$ frame on CPU and Edge GPU (Apple Silicon / Jetson Nano).

### 3.2 Deduplication Metrics
* **Duplicate Detection Precision:** $\frac{\text{True Duplicates Flagged}}{\text{Total Duplicates Flagged}}$
* **Duplicate Detection Recall:** $\frac{\text{True Duplicates Flagged}}{\text{Total Ground-Truth Duplicate Clusters}}$

### 3.3 Prioritization Alignment Metric
* **Spearman Rank Correlation Coefficient ($\rho$):**
  $$\rho = 1 - \frac{6 \sum d_i^2}{n(n^2 - 1)}$$
  Compares algorithmic priority order against blind rankings produced by 5 municipal public works engineers.

---

## 4. Planned Experimental Results Template

> [!NOTE]
> The following table represents the formal research evaluation protocol. Numerical values marked with `[PENDING BENCHMARK]` will be populated during model training on GPU clusters for the final thesis dissertation.

| Model Candidate | Backing Weights | Parameters (M) | mAP@0.5 | mAP@0.5:0.95 | CPU Latency (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *EdgeCV Heuristic (Baseline)* | Rule-based | 0.0 | *Advisory* | *Advisory* | **14.2 ms** (Observed) |
| *YOLOv8-Nano* | RDD2022 Fine-tuned | 3.2M | `[PENDING]` | `[PENDING]` | `[PENDING]` |
| *YOLOv8-Small* | RDD2022 Fine-tuned | 11.2M | `[PENDING]` | `[PENDING]` | `[PENDING]` |
| *RT-DETR-Tiny* | Transformers | 8.8M | `[PENDING]` | `[PENDING]` | `[PENDING]` |

---

## 5. Deduplication Ablation Protocol

| Deduplication Strategy | Spatial Radius | Perceptual Hash | Precision (%) | Recall (%) |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline 1:** GPS Distance Only | $50\text{ m}$ | None | `[PENDING]` | `[PENDING]` |
| **Baseline 2:** GPS Distance Only | $120\text{ m}$ | None | `[PENDING]` | `[PENDING]` |
| **CivicLens AI (Hybrid):** | $120\text{ m}$ | 64-bit dHash | `[PENDING]` | `[PENDING]` |

---

## 6. Reproducibility Guidelines
1. **Random Seed:** All data splits and hash evaluations use deterministic seeds (`seed=42`).
2. **Standardized Hardware:** Benchmarked on standard x86/ARM hardware without proprietary hardware accelerators to ensure municipal affordability.
3. **Artifact Logging:** Every evaluation experiment logs bounding box coordinates, confidences, and confusion matrices to the database audit trail.
