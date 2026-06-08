# Overview

## Current Behavior

Series can reach `BOARD_REVIEW`, but no Board vote/finalize/tie-break backend exists.

## Target Behavior

Board members can cast votes on Series in `BOARD_REVIEW`, finalize plurality results, and Board Chair can resolve ties via tie-break.

## Affected Users

- Board members
- Board Chair

## Affected Product Docs

- `docs/contracts/board-approval.md`
- `docs/contracts/workflow-status.md`

## Non-Goals

- Board frontend UI
- Vote deadline scheduler
- Audit event persistence
