#!/usr/bin/env python3
"""Train, evaluate, export, and smoke-test CivicLens YOLO11n on RDD2022 India."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

# Disable optional W&B callbacks in non-interactive Colab/local runs.
os.environ["WANDB_MODE"] = "disabled"
os.environ["WANDB_SILENT"] = "true"

import numpy as np
import onnxruntime as ort
from ultralytics import YOLO


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=Path("datasets/rdd2022-india/data.yaml"))
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--device", default="", help="0 for CUDA GPU, mps for Apple Silicon, cpu for CPU")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--project", default="runs")
    ap.add_argument("--name", default="civiclens-yolo11n-rdd2022-india")
    ap.add_argument("--weights", default="yolo11n.pt", help="Official Ultralytics YOLO11 pretrained initialization")
    args = ap.parse_args()

    data_file = args.data.resolve()
    if not data_file.is_file():
        raise SystemExit(f"Dataset YAML missing: {data_file}. Run ml/prepare_rdd2022.py first.")
    if args.epochs < 1 or args.imgsz < 32 or args.batch < 1:
        raise SystemExit("epochs, imgsz, and batch must be positive.")

    # YOLO11n starts from official pretrained weights and is fine-tuned on RDD2022.
    model = YOLO(args.weights)
    train_args = dict(
        data=str(data_file), epochs=args.epochs, imgsz=args.imgsz,
        batch=args.batch, workers=args.workers, project=args.project, name=args.name,
        pretrained=True, patience=20, seed=42, deterministic=True,
        plots=True, save=True, val=True, verbose=True,
    )
    if args.device:
        train_args["device"] = args.device
    model.train(**train_args)

    # Ultralytics train() returns metrics (not a trainer object); the run directory
    # is exposed by model.trainer.save_dir after training.
    if model.trainer is None:
        raise SystemExit("Ultralytics did not expose a trainer after the training call.")
    run_dir = Path(model.trainer.save_dir).resolve()
    best = run_dir / "weights" / "best.pt"
    last = run_dir / "weights" / "last.pt"
    if not best.is_file() or best.stat().st_size < 1_000_000:
        raise SystemExit(f"Training did not produce a credible best.pt checkpoint: {best}")

    trained = YOLO(str(best))
    metrics = trained.val(data=str(data_file), split="test", imgsz=args.imgsz, plots=True)
    class_names = ["D00", "D10", "D20", "D40"]
    maps = [float(x) for x in getattr(metrics.box, "maps", [])]
    per_class = [
        {"class_id": i, "class_code": class_names[i], "map50_95": maps[i] if i < len(maps) else None}
        for i in range(len(class_names))
    ]

    exported = trained.export(format="onnx", imgsz=args.imgsz, opset=17, simplify=False, dynamic=False)
    onnx_path = Path(str(exported)).resolve()
    if not onnx_path.is_file() or onnx_path.stat().st_size < 1_000_000:
        raise SystemExit(f"ONNX export is missing or unexpectedly small: {onnx_path}")

    # Verify that ONNX Runtime can load the graph and execute a correctly shaped input.
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    input_meta = session.get_inputs()[0]
    input_shape = [int(x) if isinstance(x, (int, np.integer)) else None for x in input_meta.shape]
    dummy = np.zeros((1, 3, args.imgsz, args.imgsz), dtype=np.float32)
    output = session.run(None, {input_meta.name: dummy})
    output_shapes = [list(np.asarray(x).shape) for x in output]
    if not output or np.asarray(output[0]).ndim != 3:
        raise SystemExit(f"Unexpected ONNX detection output: {output_shapes}")
    first_shape = np.asarray(output[0]).shape
    expected_channels = 4 + len(class_names)
    if expected_channels not in first_shape:
        raise SystemExit(
            f"ONNX output does not expose {expected_channels} channels for 4 RDD classes: {output_shapes}"
        )

    summary = {
        "model": "Ultralytics YOLO11n fine-tuned on RDD2022 India",
        "initialization": args.weights,
        "best_pt": str(best),
        "last_pt": str(last) if last.is_file() else None,
        "onnx": str(onnx_path),
        "dataset_yaml": str(data_file),
        "epochs_requested": args.epochs,
        "epochs_completed": int(getattr(model.trainer, "epoch", -1)) + 1,
        "image_size": args.imgsz,
        "metrics": {
            "map50": float(metrics.box.map50),
            "map50_95": float(metrics.box.map),
            "precision": float(metrics.box.mp),
            "recall": float(metrics.box.mr),
        },
        "per_class_map50_95": per_class,
        "classes": class_names,
        "evaluation_split": "held-out test split created from labelled RDD2022 India images",
        "onnx_runtime_smoke_test": {
            "status": "PASS",
            "providers": session.get_providers(),
            "input_name": input_meta.name,
            "input_shape": input_shape,
            "output_shapes": output_shapes,
            "model_size_bytes": onnx_path.stat().st_size,
        },
        "plots": [
            name for name in [
                "results.png", "confusion_matrix.png", "confusion_matrix_normalized.png",
                "PR_curve.png", "F1_curve.png", "P_curve.png", "R_curve.png",
            ] if (run_dir / name).is_file()
        ],
        "limitations": [
            "RDD2022 official challenge test images are unlabelled and are not used for these metrics.",
            "The held-out split is an internal split of labelled RDD2022 India data.",
            "These metrics do not establish performance on independent Nagpur road photographs.",
            "Review class-wise results, confusion matrix, prediction examples, and false positives before promotion.",
        ],
    }
    out = run_dir / "evaluation_summary.json"
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"RUN_DIR={run_dir}")
    print(f"BEST_WEIGHTS={best}")
    print(f"ONNX_EXPORT={onnx_path}")
    print(f"EVALUATION={out}")
    print(json.dumps(summary, indent=2))
    print("TRAINING_AND_ONNX_SMOKE_TEST=PASS")
    print("Production promotion is NOT automatic. Independently review the report and real Nagpur field images first.")


if __name__ == "__main__":
    main()
