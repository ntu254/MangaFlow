# Overview

## Current Behavior

Board backend endpoints exist, but the Board page still uses local sample data and does not call live vote/finalize/tie-break APIs.

## Target Behavior

Board page loads live queue data and triggers backend Board workflow endpoints for vote, finalize, and tie-break actions while keeping ranking/at-risk sections presentation-only.

## Affected Users

- Board
n- Board Chair

## Affected Product Docs

- `docs/contracts/ui-board.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/workflow-status.md`

## Non-Goals

- Dedicated Board queue endpoint
- Ranking import backend integration
- At-risk backend integration

