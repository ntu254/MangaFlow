# Overview

## Current Behavior

Ranking UI is preview-only and backend has no ranking import/finalize endpoints.

## Target Behavior

Board can import ranking rows and finalize imported/reviewed rankings. Backend calculates final score using MVP formula.

## Affected Users

- Board
- System/reporting consumers

## Affected Product Docs

- `docs/contracts/publication-ranking.md`
- `docs/contracts/workflow-status.md`

## Non-Goals

- Ranking frontend wiring
- At-risk decisions
- Publication readiness
