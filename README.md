# CivicLens AI — Road Damage Reporting & Prioritisation

A final-year B.Tech Artificial Intelligence capstone project for documenting road-condition reports, reviewing submitted evidence, and helping prioritise maintenance workflows.

**Live demonstration:** https://civiclens-ai-1mq3.onrender.com  
**Source code:** https://github.com/ayush0531/civiclens-ai

> **Research status:** The web application is deployed. The YOLO11 training pipeline is in the repository, but a completed, independently reviewed training run has not yet been produced. Until verified model artifacts are installed and approved, image analysis remains in clearly labelled research/demo mode. This project is not an official Nagpur Municipal Corporation service and does not transmit reports to NMC.

## Project overview

CivicLens AI brings together:
- A citizen-facing road-damage reporting workflow with photographic evidence and location details.
- Report tracking and administrative review workflows.
- A FastAPI backend and React frontend.
- Geospatial grouping and duplicate-report assistance.
- An explainable, configurable maintenance-priority workflow.
- An AI integration layer designed for YOLO11 inference through ONNX Runtime.

The application is an academic demonstration. It does not claim that a municipal authority has accepted, reviewed, or acted on submitted reports.

## Current AI model status

The intended detector is **Ultralytics YOLO11n fine-tuned on the labelled India subset of RDD2022**.

| Item | Status |
|---|---|
| RDD2022 preparation script | Implemented |
| YOLO11 training script | Implemented; GPU run pending |
| Trained `best.pt` checkpoint | Not yet verified |
| Held-out evaluation and confusion matrix | Pending actual training |
| ONNX export and runtime smoke test | Automated in training script; pending run |
| Independent Nagpur field evaluation | Not yet performed |
| Production model approval | Disabled until review |

Do not quote model accuracy, precision, recall, mAP, or inference latency as measured CivicLens results until the corresponding real run artifacts and evaluation data have been reviewed. The existing training split is sampled from labelled RDD2022 India training data; it is not independent Nagpur field validation.

### Training

See [the ML training guide](ml/README.md) and [the Google Colab notebook](ml/CivicLens_RDD2022_YOLO11_Training.ipynb).

The reproducible pipeline:
1. Prepares Pascal VOC annotations as YOLO labels.
2. Creates a deterministic 80/10/10 split from labelled India images.
3. Fine-tunes YOLO11n from its official pretrained initialization.
4. Evaluates the held-out split and writes metrics/plots.
5. Exports ONNX and checks that ONNX Runtime can load and execute the graph.
6. Packages the checkpoint, ONNX file, evaluation summary, and plots.

Training requires an available GPU runtime and sufficient disk space. A notebook in the repository is an execution recipe, not evidence that training has completed.

### Model promotion requirements

Do not set `AI_MODEL_VALIDATED=true` or replace the production ONNX artifact until:
- the training run completed and produced a credible `best.pt`;
- held-out metrics, class-wise results, confusion matrix, and prediction examples have been reviewed;
- the ONNX input/output contract has been verified against backend preprocessing and postprocessing;
- false positives and false negatives have been inspected;
- a separate, manually labelled Nagpur road-image set has been evaluated;
- model and dataset provenance/licensing have been documented.

## Technology

- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI
- Persistence: SQLAlchemy / SQLite configuration
- Computer vision integration: Ultralytics YOLO11 training pipeline, ONNX Runtime inference
- Deployment: Docker and Render

## Run locally

Use Python 3.10–3.12 for the ML training environment. For application setup, follow the backend and frontend instructions in their respective directories and install dependencies from their package/requirements files.

The repository includes a Dockerfile and Render configuration for deployment. Keep secrets in environment variables; never commit production credentials, private keys, or uploaded user evidence.

## Data, attribution, and licensing

RDD2022 is a separately distributed research dataset. Obtain it from its [official Figshare record](https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547), review its terms, and cite the dataset paper in academic submissions. Do not commit the raw dataset to this repository.

Ultralytics YOLO is offered under AGPL-3.0 or a commercial Enterprise licence. Review the applicable licence and obligations before redistributing or using the model commercially. The dataset's licence is separate from the software licence.

## Academic-use notice

CivicLens AI is an academic prototype for demonstration and research. It is not a certified civil-engineering inspection system, emergency service, or official municipal reporting channel. AI outputs require human review; image-based estimates do not establish physical pothole depth, dimensions, or engineering severity.
