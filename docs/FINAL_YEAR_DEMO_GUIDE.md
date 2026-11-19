# CivicLens AI — Final-Year Project Demonstration Guide

## Project overview

CivicLens AI is an academic prototype for AI-assisted road-damage reporting, triage, spatial analysis, and maintenance workflow visualization in a Nagpur municipal context.

## Demonstration workflow

1. Open the public landing page and review the project scope and limitations.
2. Create a citizen account using an email address you control and a strong password (at least 12 characters).
3. Submit a road-damage report with a clear image and location details.
4. Review the AI inspection output as decision-support information, not a certified civil-engineering measurement.
5. Use the generated CivicLens reference to follow the internal complaint workflow.
6. Explore the map, analytics, and model laboratory to explain the spatial and computer-vision components.
7. Demonstrate authority and administrator views only with privately provisioned accounts.

## Academic and operational limitations

- CivicLens records are internal to this academic prototype. The application does not claim that a complaint has been officially submitted to, acknowledged by, or resolved by Nagpur Municipal Corporation.
- The municipal handoff is citizen-assisted. Citizens must complete the official portal's own identity and verification process.
- AI predictions are decision-support outputs and require human review. Do not present model metrics as independently reproduced unless the experiment logs, dataset split, and evaluation procedure are available.
- Spatial estimates and severity scores are approximations. They are not substitutes for field inspection or calibrated engineering measurements.
- Synthetic records, when enabled in a controlled demonstration environment, must be clearly identified as synthetic.
- The current Render Free deployment uses local service storage. Do not rely on it for permanent complaint records or uploaded evidence. A persistent PostgreSQL database and durable object/file storage are required before real-world operational use.

## Security and access

- Public self-registration creates citizen accounts only.
- Authority and administrator accounts must be provisioned through a controlled, private process.
- Never publish administrator credentials, access tokens, environment secrets, or real citizen personal data.
- Rotate any credentials that were previously used in public demonstrations before presenting the application externally.

## Suggested viva explanation

CivicLens combines a React and TypeScript interface with a FastAPI backend, ONNX Runtime inference, a relational data layer, spatial clustering, duplicate-report analysis, and an explainable multi-factor maintenance prioritization workflow. The contribution is the integration of these components into a traceable academic prototype; official municipal integration and production-grade persistent infrastructure remain future deployment requirements.
