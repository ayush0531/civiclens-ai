# CivicLens AI: Future Engineering Roadmap & Thesis Extensions

---

## 1. Computer Vision & Deep Learning Enhancements

### 1.1 Custom Fine-Tuned YOLOv9 / RT-DETR Model
* **Current Prototype State:** Modular dual-mode inference interface with deterministic edge morphology feature extraction.
* **Next Engineering Phase:**
  * Fine-tune a lightweight **YOLOv8-Nano** or **RT-DETR-Tiny** model specifically on the Indian subset of the RDD2022 dataset (13,000+ annotations) and locally collected Nagpur road imagery.
  * Quantize model weights to INT8 precision via ONNX Runtime / TensorRT for edge device latency $\le 15\text{ ms}$.
  * Implement active learning pipelines: when municipal authorities resolve tickets, confirmed ground-truth defect regions are automatically fed back to retrain model checkpoints.

### 1.2 Stereoscopic & Photogrammetric Depth Estimation
* Combine monocular depth estimation neural networks (e.g. Depth Anything / MiDaS) with calibrated ground references (e.g., standard municipal curb heights or coin markers) to approximate 3D volumetric asphalt displacement in cubic decimeters ($dm^3$).

---

## 2. Geospatial Architecture & PostGIS Integration

* **Current Prototype State:** SQLite with Haversine great-circle trigonometric spherical calculations and coordinate bounding boxes.
* **Next Engineering Phase:**
  * Migrate production database to **PostgreSQL with PostGIS extensions**.
  * Use spatial GiST R-Tree spatial indexing on native `GEOMETRY(Point, 4326)` columns:
    ```sql
    SELECT * FROM road_damage_reports 
    WHERE ST_DWithin(geom, ST_MakePoint(79.0882, 21.1458)::geography, 120.0);
    ```
  * Integrate road centerline graph vectors (OpenStreetMap highway ways) to snap defect coordinates directly onto exact traffic lanes.

---

## 3. Advanced Multimodal Duplicate Detection

* **Current Prototype State:** 64-bit perceptual difference hashing (dHash) coupled with Haversine distance and temporal decay.
* **Next Engineering Phase:**
  * Extract visual embeddings using a pre-trained **CLIP (Contrastive Language-Image Pretraining)** vision encoder or lightweight MobileNetV3 embedding head.
  * Compute cosine vector similarity across embedding vectors stored in a vector database (e.g., pgvector / Qdrant) to identify matching potholes even across different angles, illumination, or weather conditions.

---

## 4. Mobile Edge & Municipal System Integration

1. **Native Offline Mobile App (React Native / Flutter):**
   * Embed ONNX Runtime Mobile or TFLite to detect defects directly on the citizen's device in real-time as they drive or walk, without requiring continuous 4G/5G uploads.
2. **Municipal ERP & Smart City Command Center APIs:**
   * Provide bidirectional webhooks to push approved maintenance work orders directly into municipal grievance systems (e.g., Nagpur Municipal Corporation NMC Citizen App / PWD SAP ERP).
   * Automatically generate PDF repair work-order manifests with contractor billing estimates based on asphalt volume and labor hours.
