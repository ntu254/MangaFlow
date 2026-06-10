# Overview

## Story

MF-HIOS-100 Placeholder Skeleton States

## Status

implemented

## Lane

normal

## Goal

Polish registered-but-unwired routes so they render MangaFlow-consistent placeholder and skeleton states instead of blank Suspense fallbacks or undefined utility classes.

## Scope

In scope:

- Shared route skeleton component.
- Placeholder page styling with MangaFlow tokens and shared components.
- Suspense fallback skeletons for reserved placeholder routes and shared detail/workspace lazy routes.
- Removal of undefined placeholder typography classes.

Out of scope:

- New feature behavior for placeholder routes.
- New backend endpoints.
- Permission or workflow rule changes.
- Replacing real pages with placeholders.

## Risk reason

This is UI polish, but placeholder copy must preserve backend-owned permission boundaries and must not imply unavailable workflow actions exist.
