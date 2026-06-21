# US-028: Fix Mangaka UI Casing and Dashboard Wiring

## 1. Summary

Fix critical role/status casing bugs in Mangaka UI that break action panels, and wire up the existing `useDashboard` hook to the Mangaka dashboard components.

## 2. Details

Based on `Mangaka-UI-Review.md`:

1.  **Bug casing role (`$id.tsx`)**: Actions like Delete Draft, Withdraw Proposal, Cancel are hidden because they check for uppercase role `role === "MANGAKA"` but `useRole()` returns lowercase `"mangaka"`.
2.  **Dashboard Wiring**: `features/dashboard/components/MangakaDash.tsx` and its panels are using hardcoded mock data. They should be wired to the existing `useDashboard("mangaka")` hook.

## 3. Acceptance Criteria

-   [ ] Mangaka actions in Series detail (`$id.tsx`) are visible and functional when status and role match correctly.
-   [ ] Role casing comparisons are standardized to lowercase (`"mangaka"`, `"admin"`, `"board"`).
-   [ ] Mangaka Dashboard displays data from the API via `useDashboard`.
-   [ ] Hardcoded numbers in `ProductionOverview` are replaced with real data.
-   [ ] `MangakaHeader` uses the actual user from context, not mock data.

## 4. Execution Plan

1.  Update `client/src/routes/app/series/$id.tsx` to fix the role casing checks.
2.  Update `client/src/features/dashboard/components/MangakaDash.tsx` to fetch data using `useDashboard`.
3.  Update sub-components like `ProductionOverview.tsx`, `MangakaHeader.tsx`, `RecentChaptersList.tsx` to accept and display the real data passed down from `MangakaDash.tsx`.

## 5. Validation

-   Manual verification: Log in as Mangaka, view a draft series, ensure 'Delete Draft' and 'Withdraw Proposal' buttons appear.
-   Manual verification: View Mangaka Dashboard, ensure numbers align with API response and no mock data is shown.