# Overview

## Story

MF-HIOS-091 Admin Series Monitor

## Status

implemented

## Lane

high-risk

## Goal

Wire `/app/admin/series` to a read-only Admin monitor that lists backend Series records without granting creative workflow actions.

## Scope

In scope:

- Prove backend Admin can list all Series through existing `GET /api/series`.
- Reuse the MF-HIOS-088 `SeriesListPanel` monitor/read-only mode.
- Add an Admin Series Monitor page with loading, error, empty, and summary states.
- Replace the `/app/admin/series` placeholder route.

Out of scope:

- Admin series approval, rejection, review, publication, or Board override actions.
- Series creation by Admin.
- New backend mutation routes.
- File upload or signed URL changes.

## High-risk reason

This story touches an Admin monitoring surface for Series data. It must preserve the rule that Admin is a system operator, not a creative workflow approver or Board decision override.
