# Validation

## Proof Strategy

MF-019 is complete when:
1. Integration tests prove that system Admins and series Editors can approve and request revision for manuscripts, chapters, and pages.
2. Integration tests verify that approval is blocked for pages and chapters if they contain any unresolved comments, returning `400 Bad Request`.
3. Non-authorized roles are rejected with `403 Forbidden` or `401 Unauthorized`.
4. Type check and quick verification test suites pass successfully.
5. The Harness database marks the story as `implemented`.

## Test Plan

| Layer | Cases |
| --- | --- |
| Integration | - `POST /api/manuscripts/:manuscriptId/approve`: admin/editor successfully approves manuscript, changing status to `APPROVED`. Unrelated roles get 403.<br>- `POST /api/manuscripts/:manuscriptId/request-revision`: admin/editor requests revision, changing status to `REVISION_REQUESTED`. Unrelated roles get 403.<br>- `POST /api/pages/:pageId/editor-approve`: success transitions status to `EDITOR_APPROVED`. Blocked by unresolved comments (returns 400). Unrelated roles get 403.<br>- `POST /api/pages/:pageId/request-revision`: success transitions status to `NEEDS_REVISION`. Unrelated roles get 403.<br>- `POST /api/chapters/:chapterId/approve`: success transitions status to `READY_FOR_PUBLICATION`. Blocked if any page in chapter has unresolved comments (returns 400). Unrelated roles get 403.<br>- `POST /api/chapters/:chapterId/request-revision`: success transitions status to `IN_PROGRESS`. Unrelated roles get 403. |
| Platform | Server typecheck and quick verification build. |

## Commands

```text
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-019
npm run test:quick
```

## Acceptance Evidence

Implemented and verified:
- `npm run typecheck --workspace server` passed cleanly.
- `npm run test --workspace server` passed: 25 files, 100 tests.
- `.\scripts\bin\harness-cli.exe story verify MF-019` passed.
- `npm run test:quick` passed: client/server typecheck, server tests 25 files/100 tests, client tests 9 files/34 tests, client/server build.
- `harness.db` updated to mark `MF-019` as `implemented`.

