#!/usr/bin/env python3
"""Train, evaluate, and export CivicLens YOLO11n on prepared RDD2022 India data."""
from __future__ import annotations
import argparse, json, os
from pathlib import Path

# Keep Ultralytics' optional W&B callback from treating the filesystem output
# directory as a W&B project name (absolute paths contain forbidden slashes).
os.environ["WANDB_MODE"] = "disabled"
os.environ["WANDB_SILENT"] = "true"

from ultralytics import YOLO


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=Path("datasets/rdd2022-india/data.yaml"))
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--device", default="", help="0 for CUDA GPU, mps for Apple Silicon, cpu for CPU")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--project", default="runs")
    ap.add_argument("--name", default="civiclens-yolo11n-rdd2022-india")
    ap.add_argument("--weights", default="yolo11n.pt", help="Official Ultralytics pretrained initialization")
    args = ap.parse_args()
    if not args.data.is_file(): raise SystemExit(f"Dataset YAML missing: {args.data}. Run prepare_rdd2022.py first.")
    # W&B is disabled via WANDB_MODE before importing Ultralytics.
    model = YOLO(args.weights)
    train_args = dict(data=str(args.data), epochs=args.epochs, imgsz=args.imgsz,
        batch=args.batch, workers=args.workers, project=args.project, name=args.name,
        pretrained=True, patience=20, seed=42, deterministic=True, plots=True,
        save=True, val=True, verbose=True)
    if args.device: train_args["device"] = args.device
    train_result = model.train(**train_args)
    best = Path(train_result.save_dir) / "weights" / "best.pt"
    if not best.is_file(): raise SystemExit(f"Training finished without best.pt: {best}")
    trained = YOLO(str(best))
    metrics = trained.val(data=str(args.data), split="test", imgsz=args.imgsz, plots=True)
    summary = {
        "model": "Ultralytics YOLO11n fine-tuned on RDD2022 India",
        "weights": str(best),
        "dataset": str(args.data),
        "epochs_requested": args.epochs,
        "image_size": args.imgsz,
        "metrics": {
            "map50": float(metrics.box.map50),
            "map50_95": float(metrics.box.map),
            "precision": float(metrics.box.mp),
            "recall": float(metrics.box.mr)
        },
        "classes": ["D00", "D10", "D20", "D40"],
        "evaluation_split": "held-out 10% subset of labelled RDD2022 India training images",
        "limitations": ["RDD2022 official challenge test images are unlabelled and are not used for these metrics.",
            "Metrics are dataset-specific and do not establish Nagpur field performance."]
    }
    out = Path(train_result.save_dir) / "evaluation_summary.json"
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    export_model = YOLO(str(best))
    exported = export_model.export(format="onnx", imgsz=args.imgsz, opset=17, simplify=False, dynamic=False)
    print(f"BEST_WEIGHTS={best}")
    print(f"ONNX_EXPORT={exported}")
    print(f"EVALUATION={out}")
    print(json.dumps(summary, indent=2))
    print("Do not mark the production model validated until a reviewer checks labels, leakage, per-class metrics, false positives, and real Nagpur field images.")

if __name__ == "__main__": main()
