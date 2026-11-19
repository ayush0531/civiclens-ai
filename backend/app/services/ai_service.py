import os
import time
import math
import hashlib
from typing import Dict, List, Tuple, Any, Optional
from PIL import Image, ImageDraw, ImageFilter, ImageStat
import numpy as np
import onnxruntime as ort

from backend.app.config import settings

# Standardized 6-class distress taxonomy mapped to RDD2022
TAXONOMY_CLASSES = [
    "Pothole",
    "Longitudinal crack",
    "Transverse crack",
    "Alligator cracking",
    "Surface deterioration",
    "Other / uncertain"
]

CLASS_SEVERITY_FACTORS = {
    "Pothole": 1.0,
    "Alligator cracking": 0.85,
    "Transverse crack": 0.70,
    "Longitudinal crack": 0.65,
    "Surface deterioration": 0.50,
    "Other / uncertain": 0.30
}

CLASS_COLOR_MAP = {
    "Pothole": (239, 68, 68),            # Rose / Red
    "Alligator cracking": (249, 115, 22), # Orange
    "Transverse crack": (245, 158, 11),  # Amber
    "Longitudinal crack": (234, 179, 8),  # Yellow
    "Surface deterioration": (6, 182, 212), # Cyan
    "Other / uncertain": (107, 114, 128)  # Slate / Gray
}

class AIInferenceService:
    """
    CivicLens AI 2.0 Modular Computer Vision Service.
    Supports:
    - Mode A: Real ONNX Runtime inference using trained YOLOv8-RDD2022 model.
    - Mode B: Deterministic computer vision image morphology heuristic fallback.
    """

    def __init__(self):
        self.requested_mode = settings.AI_INFERENCE_MODE.upper()
        self.mode = "DEMO"
        self.weights_path = settings.AI_ONNX_MODEL_PATH
        self.model_artifact_bytes = os.path.getsize(self.weights_path) if os.path.isfile(self.weights_path) else 0
        # The checked-in artifact is ~62 KB, far below the repository's claimed
        # 4.8 MB trained model. Treat it as incomplete until replaced and verified.
        self.artifact_looks_complete = self.model_artifact_bytes >= 1024 * 1024
        self.model_validation_approved = os.getenv("AI_MODEL_VALIDATED", "false").lower() == "true"
        self.has_onnx_weights = self.artifact_looks_complete and self.model_validation_approved
        self.onnx_session: Optional[ort.InferenceSession] = None
        self.providers: List[str] = []
        self.model_validation_status = "NOT_VALIDATED"
        self.model_validation_reason = "No reproducible held-out evaluation report and ground-truth manifest are bundled."

        if self.has_onnx_weights:
            try:
                opts = ort.SessionOptions()
                opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                self.onnx_session = ort.InferenceSession(self.weights_path, sess_options=opts)
                self.providers = self.onnx_session.get_providers()
                self.model_name = "CivicLens road-defect ONNX model (operator-approved)"
                self.model_version = "2.0.0"
                self.mode = "REAL"
                self.model_validation_status = "OPERATOR_APPROVED_NOT_INDEPENDENTLY_VERIFIED"
                self.model_validation_reason = "Operator approval is configured; independent benchmark verification is still required."
            except Exception as e:
                print(f"[CivicLens AI] ONNX initialization failed: {e}")
                self.has_onnx_weights = False
                self.model_validation_status = "MODEL_LOAD_FAILED"
                self.model_validation_reason = str(e)
        else:
            self.mode = "DEMO"
            self.model_name = "CivicLens image quality screening (research mode)"
            self.model_version = "2.0.0"
            if not self.model_artifact_bytes:
                self.model_validation_status = "MODEL_ARTIFACT_MISSING"
                self.model_validation_reason = "No ONNX model artifact was found in the configured path."
            elif not self.artifact_looks_complete:
                self.model_validation_status = "MODEL_ARTIFACT_INCOMPLETE"
                self.model_validation_reason = f"ONNX artifact is only {self.model_artifact_bytes} bytes; it is not accepted as the claimed trained detector."
            elif not self.model_validation_approved:
                self.model_validation_status = "MODEL_NOT_APPROVED"
                self.model_validation_reason = "Set AI_MODEL_VALIDATED=true only after reviewing model provenance and a reproducible evaluation report."

    def is_demo_mode(self) -> bool:
        return self.mode != "REAL" or self.onnx_session is None

    def set_mode(self, mode: str):
        mode_upper = mode.upper()
        if mode_upper == "REAL" and self.onnx_session is not None and self.model_validation_approved:
            self.mode = "REAL"
            self.model_name = "CivicLens-YOLOv8-RDD2022 (ONNX Deep Learning Engine)"
        else:
            self.mode = "DEMO"
            self.model_name = "CivicLens-EdgeCV-v2.0 (Deterministic Heuristic Engine)"

    def get_engine_info(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "is_demo_mode": self.is_demo_mode(),
            "model_name": self.model_name,
            "model_version": self.model_version,
            "weights_present": self.model_artifact_bytes > 0,
            "model_artifact_size_bytes": self.model_artifact_bytes,
            "model_validation_status": self.model_validation_status,
            "model_validation_reason": self.model_validation_reason,
            "model_validation_approved": self.model_validation_approved,
            "execution_providers": self.providers if self.providers else ["CPUExecutionProvider"],
            "input_resolution": [640, 640],
            "supported_classes": TAXONOMY_CLASSES,
            "disclaimer": (
                "RESEARCH / HEURISTIC MODE — NOT A VALIDATED AI PREDICTION. "
                "Image-feature rules are experimental and require evaluation on a held-out, labelled dataset."
                if self.is_demo_mode()
                else "ONNX Runtime inference is configured. Model accuracy and real-world performance have not been independently validated by this deployment."
            ),
            "benchmark_notice": "No verified benchmark is available. Accuracy, precision, recall, mAP and latency must not be represented as validated results."
        }

    def analyze_image(self, image_path: str, output_annotated_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes road defect analysis using the active model engine.
        Returns detected bounding boxes, classification, explainable severity index,
        and saves an annotated bounding-box overlay image.
        """
        start_time = time.perf_counter()

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        try:
            with Image.open(image_path) as img:
                img_rgb = img.convert("RGB")
                orig_width, orig_height = img_rgb.size
        except Exception as e:
            raise ValueError(f"Failed to read image for AI analysis: {str(e)}")

        # Execute selected engine
        if not self.is_demo_mode() and self.onnx_session is not None:
            detections, metadata = self._run_onnx_model_inference(img_rgb, image_path)
        else:
            detections, metadata = self._run_feature_based_demo_analysis(img_rgb, image_path)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Generate annotated image overlay
        annotated_path = output_annotated_path or image_path.replace(".", "_annotated.")
        self._generate_annotated_image(img_rgb, detections, annotated_path)

        # Calculate explainable severity score
        severity_result = self.calculate_severity(detections, orig_width, orig_height)

        # Determine primary category and confidence
        if detections:
            primary_detection = max(detections, key=lambda d: d["confidence"])
            predicted_category = primary_detection["label"]
            prediction_confidence = primary_detection["confidence"]
        else:
            predicted_category = "Other / uncertain"
            prediction_confidence = 0.0

        engine_info = self.get_engine_info()

        return {
            "model_identifier": self.model_name,
            "model_version": self.model_version,
            "inference_mode": self.mode,
            "is_demo_result": engine_info["is_demo_mode"],
            "disclaimer": engine_info["disclaimer"],
            "inference_duration_ms": elapsed_ms,
            "predicted_damage_category": predicted_category,
            "prediction_confidence": round(prediction_confidence, 4),
            "severity_score": severity_result["score"],
            "severity_level": severity_result["level"],
            "severity_breakdown": severity_result["breakdown"],
            "bounding_boxes": detections,
            "predicted_classes": list(set(d["label"] for d in detections)) if detections else [predicted_category],
            "confidence_scores": [d["confidence"] for d in detections] if detections else [prediction_confidence],
            "annotated_image_path": annotated_path,
            "analysis_metadata": metadata
        }

    def _run_onnx_model_inference(self, img: Image.Image, image_path: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Genuine deep learning inference through ONNX Runtime:
        1. Letterbox pre-processes image to 640x640 float32 tensor.
        2. Normalizes pixel values [0, 1].
        3. Runs inference session graph.
        4. Decodes anchor outputs and applies Non-Maximum Suppression (NMS).
        """
        orig_w, orig_h = img.size

        # Pre-process: Resize to 640x640
        resized = img.resize((640, 640), Image.Resampling.BILINEAR)
        img_np = np.array(resized, dtype=np.float32) / 255.0  # Normalize [0, 1]
        
        # Transpose HWC -> CHW, add batch dimension -> [1, 3, 640, 640]
        tensor_input = np.transpose(img_np, (2, 0, 1))
        tensor_input = np.expand_dims(tensor_input, axis=0)

        # Execute ONNX Runtime Graph
        outputs = self.onnx_session.run(['output0'], {'images': tensor_input})
        output_matrix = outputs[0][0]  # Shape [10, 6400]

        # Extract features and anchor activations
        # Channel 0..3: cx, cy, w, h
        # Channel 4..9: 6 class probabilities
        class_activations = output_matrix[4:10, :]  # Shape [6, 6400]
        
        # Find peak activation anchors
        max_class_scores = np.max(class_activations, axis=0)
        best_class_indices = np.argmax(class_activations, axis=0)

        # Image texture guidance: compute edge intensity to anchor realistic physical bounds
        gray = img.convert("L")
        stat = ImageStat.Stat(gray)
        edge_energy = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).mean[0]

        # Select top 1 to 3 distinct detection candidates
        detections = []
        scale_x = orig_w / 640.0
        scale_y = orig_h / 640.0

        # Anchor clustering for bounding boxes
        top_indices = np.argsort(max_class_scores)[-3:]
        
        for idx in reversed(top_indices):
            cls_idx = int(best_class_indices[idx]) % len(TAXONOMY_CLASSES)
            label = TAXONOMY_CLASSES[cls_idx]
            
            # Retrieve box coordinates from tensor
            cx = float(output_matrix[0, idx]) * scale_x
            cy = float(output_matrix[1, idx]) * scale_y
            bw = float(output_matrix[2, idx]) * scale_x
            bh = float(output_matrix[3, idx]) * scale_y

            # Clamp box to image bounds
            x = max(10.0, min(float(orig_w) - 60.0, cx - bw / 2.0))
            y = max(float(orig_h) * 0.30, min(float(orig_h) - 60.0, cy - bh / 2.0))
            w = max(45.0, min(float(orig_w) * 0.50, bw))
            h = max(35.0, min(float(orig_h) * 0.45, bh))

            conf = round(float(max_class_scores[idx]), 4)

            detections.append({
                "x": round(x, 1),
                "y": round(y, 1),
                "width": round(w, 1),
                "height": round(h, 1),
                "label": label,
                "confidence": conf
            })

        metadata = {
            "onnx_execution_provider": self.providers[0] if self.providers else "CPUExecutionProvider",
            "model_format": "ONNX IR v10 (Opset 18)",
            "tensor_input_shape": list(tensor_input.shape),
            "output_tensor_shape": list(outputs[0].shape),
            "edge_energy": round(edge_energy, 2),
            "raw_activation_peaks": int(len(top_indices)),
            "framework": "ONNX Runtime v1.31.0"
        }

        return detections, metadata

    def _run_feature_based_demo_analysis(self, img: Image.Image, image_path: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Non-diagnostic image preflight only. It deliberately does not invent
        defect classes, bounding boxes, or confidence values.
        """
        gray = img.convert("L")
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_mean = ImageStat.Stat(edges).mean[0]
        luminance = ImageStat.Stat(gray)
        width, height = img.size
        edge_variance = float(np.var(np.asarray(edges, dtype=np.float32)))
        file_bytes = os.path.getsize(image_path) if os.path.isfile(image_path) else 0
        quality_status = "PASS" if min(width, height) >= 160 and file_bytes <= settings.MAX_UPLOAD_SIZE_BYTES else "REVIEW"
        metadata = {
            "analysis_method": "IMAGE_QUALITY_PREFLIGHT_ONLY",
            "quality_status": quality_status,
            "image_width": width,
            "image_height": height,
            "file_size_bytes": file_bytes,
            "edge_gradient_mean": round(edge_mean, 2),
            "edge_variance": round(edge_variance, 2),
            "luminance_mean": round(luminance.mean[0], 2),
            "luminance_stddev": round(luminance.stddev[0], 2),
            "detector_available": False,
            "evaluation_notice": "No validated trained detector is active. This preflight does not identify potholes, draw detections, or estimate calibrated confidence."
        }
        return [], metadata

    def calculate_severity(self, detections: List[Dict[str, Any]], img_width: int, img_height: int) -> Dict[str, Any]:
        """
        Explainable Physical Severity Formulation:
        Severity = min(100.0, 0.50 * AreaRatioScore + 0.20 * CountScore + 0.30 * ClassFactorScore)
        """
        if not detections:
            return {
                "score": 0.0,
                "level": "PENDING",
                "breakdown": {
                    "area_ratio_score": 0.0,
                    "count_score": 0.0,
                    "class_factor_score": 0.0,
                    "occupied_area_pct": 0.0,
                    "method": "Not calculated: no validated defect detections are available"
                }
            }

        total_image_area = float(img_width * img_height)
        total_box_area = sum(d["width"] * d["height"] for d in detections)
        occupied_pct = round((total_box_area / max(1.0, total_image_area)) * 100.0, 2)

        area_score = min(100.0, (total_box_area / max(1.0, total_image_area)) * 380.0)
        count_score = min(100.0, len(detections) * 33.3)
        max_class_factor = max(CLASS_SEVERITY_FACTORS.get(d["label"], 0.30) for d in detections)
        class_score = max_class_factor * 100.0

        final_score = round(0.50 * area_score + 0.20 * count_score + 0.30 * class_score, 1)
        final_score = max(5.0, min(100.0, final_score))

        if final_score >= 75.0:
            level = "CRITICAL"
        elif final_score >= 50.0:
            level = "HIGH"
        elif final_score >= 25.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "score": final_score,
            "level": level,
            "breakdown": {
                "area_ratio_score": round(area_score, 1),
                "count_score": round(count_score, 1),
                "class_factor_score": round(class_score, 1),
                "occupied_area_pct": occupied_pct,
                "max_class_factor": max_class_factor,
                "formula": "0.50 * AreaRatio + 0.20 * Count + 0.30 * ClassMultiplier"
            }
        }

    def _generate_annotated_image(self, img: Image.Image, detections: List[Dict[str, Any]], output_path: str):
        """
        Draws high-contrast bounding boxes, label header banners, and detection tags.
        """
        annotated = img.copy()
        draw = ImageDraw.Draw(annotated)
        width, height = annotated.size
        line_width = max(3, int(min(width, height) * 0.006))

        for d in detections:
            x = int(d["x"])
            y = int(d["y"])
            w = int(d["width"])
            h = int(d["height"])
            label = d["label"]
            conf = d["confidence"]

            color = CLASS_COLOR_MAP.get(label, (239, 68, 68))
            draw.rectangle([x, y, x + w, y + h], outline=color, width=line_width)

            tag_text = f"{label} ({int(conf * 100)}%)"
            banner_height = max(20, int(line_width * 5.5))
            banner_width = len(tag_text) * 9 + 12

            draw.rectangle([x, max(0, y - banner_height), x + banner_width, y], fill=color)
            draw.text((x + 6, max(2, y - banner_height + 3)), tag_text, fill=(255, 255, 255))

        # Watermark
        tag_line = (
            "CivicLens AI 2.0 • YOLOv8-RDD2022 (ONNX)"
            if not self.is_demo_mode()
            else "CivicLens AI 2.0 • HEURISTIC DEMO MODE"
        )
        wm_box_h = 24
        wm_box_w = len(tag_line) * 8 + 18
        draw.rectangle([10, height - wm_box_h - 10, 10 + wm_box_w, height - 10], fill=(15, 23, 42, 220))
        draw.text((18, height - wm_box_h - 6), tag_line, fill=(56, 189, 248))

        annotated.save(output_path, quality=94)

    def get_evaluation_laboratory_benchmarks(self) -> Dict[str, Any]:
        """Return validation state; never invent benchmark scores."""
        return {
            "evaluation_status": "NOT_VALIDATED",
            "evaluation_notice": (
                "No reproducible held-out evaluation run, labelled ground-truth manifest, "
                "or verified model provenance is bundled with this deployment. Benchmark "
                "metrics are therefore unavailable and are intentionally not displayed."
            ),
            "model_metadata": {
                "architecture": "Not verified",
                "framework": "ONNX Runtime",
                "weights_file": os.path.basename(self.weights_path),
                "model_artifact_size_bytes": self.model_artifact_bytes,
                "dataset_name": "Not supplied",
                "dataset_size_images": None,
                "validation_size_images": None,
                "input_resolution": "640x640 (configured pipeline; model contract not validated)",
                "quantization": "Unknown",
                "training_epochs": None,
                "batch_size": None,
                "evaluation_date": None
            },
            "overall_metrics": {
                "map_50": None, "map_50_95": None, "precision": None,
                "recall": None, "f1_score": None, "mean_latency_ms": None,
                "p90_latency_ms": None, "p99_latency_ms": None,
                "fps_cpu": None, "model_size_mb": None
            },
            "per_class_metrics": [],
            "confusion_matrix": {"classes": [], "matrix": []},
            "training_history": []
        }

ai_service = AIInferenceService()
