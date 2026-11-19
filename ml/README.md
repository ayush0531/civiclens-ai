# CivicLens AI — reproducible YOLO11 training

This folder is the **actual training pipeline**, not a claim that a trained pothole model is already available. It starts from the official Ultralytics YOLO11n pretrained initialization and fine-tunes it on the labelled India portion of RDD2022.

## Dataset provenance

- Dataset: RDD2022 — multi-national Road Damage Dataset (India subset).
- Source: https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547
- Project download notes: https://github.com/sekilab/RoadDamageDetector
- The source distribution includes annotated Pascal VOC XML for labelled training images and a separate unlabelled challenge test set. This pipeline creates a deterministic 80/10/10 split from labelled India images; it does **not** invent labels for the unlabelled challenge test set.
- Cite the RDD2022 paper in reports: Arya et al., “RDD2022: A multi-national image dataset for automatic Road Damage Detection,” 2022.
- Review and retain the dataset's attribution/licence terms from the download record before redistribution. Do not commit the dataset or its images to this repository.

## Class contract

| YOLO id | RDD2022 label | CivicLens meaning |
|---:|---|---|
| 0 | D00 | Longitudinal crack |
| 1 | D10 | Transverse crack |
| 2 | D20 | Alligator crack |
| 3 | D40 | Pothole |

This is a four-class detector. It does not claim to detect surface deterioration or an “other” class.

## Reproduce

Use Python 3.10–3.12 and preferably a CUDA GPU (Google Colab GPU is suitable). Training on CPU is possible but can take a long time.

1. Download and extract the RDD2022 India archive from the source links above. Do not upload the raw dataset to GitHub.
2. Install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
```

3. Convert Pascal VOC XML to YOLO labels and make a deterministic split:

```bash
python ml/prepare_rdd2022.py --source /path/to/extracted/RDD2022_India
```

4. Train (choose the device available to your machine):

```bash
python ml/train_yolo11.py --device 0 --epochs 100 --batch 16
```

For Apple Silicon use `--device mps`; for CPU use `--device cpu --batch 4`.

5. Inspect the generated confusion matrix, PR curve, per-class AP, validation plots, `evaluation_summary.json`, `best.pt`, and exported ONNX file under `ml/runs/civiclens-yolo11n-rdd2022-india/`.

## Reproducibility and honest reporting

- Random seed is 42; deterministic training is requested.
- Report the actual run's metrics. Never copy placeholder metrics from old UI cards or README text.
- The 10% test partition is a held-out split of labelled RDD2022 India training images, not the official competition test set.
- Add a second external evaluation set of Nagpur road photographs with manually verified bounding boxes before claiming local field validation.
- A confidence score is not automatically calibrated probability.
- Bounding-box area in a single perspective image is not physical pothole area/depth. Do not call it engineering-verified severity without calibrated scale/depth or field measurements.

## Licensing

Ultralytics YOLO11 is offered under AGPL-3.0 or a commercial Enterprise licence. This repository's use is intended for open academic research. Publish the complete corresponding source, modifications, training scripts, configurations, and model artifacts as required by the applicable AGPL terms. Review the full licence and attribution obligations before any non-academic/commercial use.

The RDD2022 dataset has separate attribution/licensing terms; its licence does not become AGPL merely because it is used to train YOLO. Keep the dataset separate from the source repository.

## Model promotion gate

Do not set `AI_MODEL_VALIDATED=true` or replace the production ONNX model until:
1. training and held-out evaluation completed successfully;
2. class mapping and ONNX input/output tensor contract are verified;
3. test images and prediction overlays are manually reviewed;
4. per-class metrics and failure examples are recorded;
5. an independent Nagpur field set is evaluated;
6. the trained weights' provenance and licence are documented.
