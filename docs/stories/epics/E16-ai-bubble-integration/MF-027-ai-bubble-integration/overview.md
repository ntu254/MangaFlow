# MF-027 AI Bubble Integration

## Current Behavior

Initially, speech bubble detection and whitening were simulated with client-side or server-side mock coordinates.

## Target Behavior

The backend and frontend integrate with the FastAPI Python microservice running on port 8000:
- Backend `/api/ai/detect` and `/api/ai/whiten` proxy calls to the FastAPI service.
- Assistant Workspace uses active AI endpoints to perform bubble boundary overlay mapping and bubble text whitening dynamically.

## Affected Users

- Assistant
- Mangaka
- Editor

## Affected Product Docs

- `docs/01_complete_spec.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`
- `docs/product/mvp-roadmap.md`
