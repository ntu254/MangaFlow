# Mobile Flow Remediation (Mobile-only) Design

**Date:** 2026-08-04  
**Status:** Approved design; awaiting spec review  
**Scope:** Expo mobile client and mobile-focused documentation only.

## Goal

Make the Board and Tantou Editor mobile workflow truthful, safe on a physical
device, and free from nested virtual-list scrolling. The mobile app must hide
Board capabilities that are intentionally unavailable on mobile without
changing the backend, web application, or audit records.

## In scope

- Replace the app-shell vertical `ScrollView` so an inbox `FlatList` is never
  nested in a vertical plain `ScrollView`.
- Keep review-file display URLs in memory, renew them 30 seconds before the
  server-provided expiry, and document physical-device API configuration.
- Describe PDF handling accurately: inline only where supported; Android uses
  the device's external PDF handler.
- After an Editor forwards a proposal, show its Board-awaiting state and hide
  stale editorial commands.
- Hide At Risk work and actions from all Board mobile surfaces.
- Hide Cancel session from Board mobile surfaces.
- Hide Chair lifecycle controls after a session is no longer open.
- Align publication scheduling copy with the required manual `PUBLISH` action.
- Remove the mobile tie-resolution UI; display terminal tied rounds only as
  re-vote history/context.

## Out of scope

- No backend endpoint, authorization, data-model, migration, seed, web UI, or
  audit-history changes for At Risk or session cancellation.
- No replacement workflow for an accidentally opened session. On mobile, an
  open session follows the existing close/re-vote path.
- No new PDF renderer for Android.

## Architecture and data flow

`MFScreen` becomes a non-scrolling shell. Each active body owns its scrolling
primitive: `TodayQueue` owns `FlatList`; detail pages and static screens own
their own `ScrollView`. This preserves FlatList windowing and removes the
same-orientation nesting warning.

The review-file viewer retains the current lazy URL acquisition design:
metadata has no URL; opening a file calls `POST /files/display-url`; the URL
is stored only in component state; the timer renews at `expiresAt - 30s`.
The server expiry remains authoritative. Documentation distinguishes the
display-token lifetime from the R2 presign lifetime and requires a LAN/deployed
API URL on physical devices.

Editor proposal detail derives visible commands from the backend descriptor
and the current proposal status. Once it is `PENDING_BOARD` or later, the
mobile surface is read-only and explains that it is waiting for Board action.
The backend remains the authorization authority.

Board mobile filters out `AT_RISK` inbox items, ranking CTAs/metrics and
at-risk history entries. It also omits `SESSION_CANCEL` from the session UI.
For terminal sessions, lifecycle command controls are not rendered rather
than being shown disabled. The existing backend capability responses remain
unchanged.

## UX rules

- Schedule means schedule only. The confirmation says the Editor must publish
  when the schedule is due.
- A `TIED` session is historical/read-only. The user sees re-vote context, not
  a decision control.
- Android PDF handoff clearly labels the action as opening the device PDF
  reader; unsupported file types use the same external pattern.
- A physical-device configuration error is diagnosed through the existing safe
  request diagnostics and documented without embedding credentials.

## Validation

- Unit tests verify no mobile Board view renders or invokes At Risk/Cancel.
- Unit tests verify terminal sessions omit Chair controls and forwarded
  proposals omit editorial actions.
- A render test verifies the app shell does not wrap `TodayQueue` in a vertical
  `ScrollView`.
- File-review tests cover server expiry, 30-second early renewal, one failure
  retry, and PDF platform routing.
- Run `npm run lint --prefix mobile`, `npm test --prefix mobile`, and
  `npm run build --prefix mobile`.

## Documentation changes

Update `mobile/README.md`, `mobile/MOBILE_AGENT_CONTEXT.md`, and the relevant
business-flow notes to state the mobile-only boundary. The backend governance
documentation continues to describe At Risk and session cancellation as web/
backend capabilities; it must not imply that mobile exposes them.
