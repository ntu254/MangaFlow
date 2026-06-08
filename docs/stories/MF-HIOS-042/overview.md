# Overview

## Current Behavior

Board page uses `GET /series` and client filters Board-visible rows.

## Target Behavior

Board page uses dedicated `GET /api/board/queue` endpoint. Backend owns queue projection, decision status, and vote summaries.

## Affected Users

- Board
- Board Chair

## Affected Product Docs

- `docs/contracts/ui-board.md`
- `docs/contracts/board-approval.md`

## Non-Goals

- Ranking import backend
- At-risk backend
- Vote deadline scheduler
