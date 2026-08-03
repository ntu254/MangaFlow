# Mobile Submitted File Review Design

## Goal

Enable Board members and assigned Tantou Editors to perform a basic mobile review of files already visible to them in the desktop workflow, without widening backend authorization or persisting signed file URLs.

## Scope

- Editor proposal review: show the current proposal manuscript and visible proposal attachments.
- Editor chapter review: show the frozen chapter-review file context and visible page/submission attachments.
- Board proposal review: show the frozen proposal manuscript and visible proposal attachments only.
- Preview images and PDFs inline in a full-screen mobile viewer; for other MIME types, show metadata and use the platform open/share flow.
- Retain local mock data only for development UI fallback. Production file access must use the backend.

## Non-goals

- No file upload, replacement, annotation, download persistence, or offline cache.
- No access to production/chapter files for Board users.
- No client-side permission checks, URL signing, or workflow-status calculation.
- No viewer for unsupported binary formats.

## Architecture

1. The mobile data source exposes a role-scoped `getReviewFiles(...)` read and a `getFileDisplayUrl(fileId)` operation. It returns file metadata without a URL until the user chooses Preview or Open.
2. The backend owns record visibility and returns a short-lived signed display URL. The mobile app never constructs a storage URL or stores it persistently.
3. A focused `SubmittedFilesPanel` renders metadata rows and launches a `ReviewFileViewer`. Both Editor and Board detail screens reuse these components.
4. The viewer holds only an in-memory URL and expiry timestamp. It refreshes the display URL whenever it is absent, expires within 30 seconds, the viewer regains foreground after expiry, or an image/PDF load fails with an authorization/expiry-style response. This prevents a 900-second signed URL from making later files invisible during a long review session.
5. The viewer retries one refreshed URL per open attempt. If it still fails, it shows a recoverable error and an explicit Retry action; it never silently substitutes a mock URL.

## File and permission model

| Role and review context | Files available in mobile |
| --- | --- |
| Editor, proposal review | Current proposal manuscript and proposal attachments visible to the assigned Editor. |
| Editor, chapter review | Files explicitly returned for the assigned Tantou's chapter-review snapshot, pages, and linked submissions. |
| Board, proposal review | Current frozen proposal manuscript and proposal attachments visible to Board. |
| Board, rankings/at-risk | None; these screens do not expose proposal or production files. |

The UI must display data returned by the API only. A `403` means no longer authorized; a `404` means unavailable/deleted; both are terminal for that attempt and must not leak prior metadata or URLs.

## User experience

- The existing proposal-summary detail gains a **Submitted files** section with file name, version, MIME label, size, submitter, and submission time.
- Selecting an image or PDF opens a full-screen viewer with title, type/size, close, retry, and open/share controls. The list remains intact when the viewer closes.
- Other formats show the same metadata and an **Open file** action; unavailable files show an inline status rather than a dead button.
- Empty state: “No submitted files are available for this review.”
- Loading state applies per selected file so opening one file never blocks the rest of the queue.

## Signed URL lifecycle

- The client treats every signed URL as short-lived and assumes the backend may use a 900-second TTL.
- Do not prefetch URLs for every row.
- Fetch immediately before rendering/opening a file and record the returned expiry if supplied. When expiry is not supplied, use a conservative in-memory expiry of eight minutes.
- On refresh, discard the old URL before requesting the next one. No URL is written to AsyncStorage, device storage, logs, analytics, or mock fixtures.
- A failure due to an expired URL triggers exactly one refresh-and-retry. A second failure is shown to the user with **Retry**, which initiates a new request manually.

## API contract additions

The backend contract must provide role-scoped review-file metadata and a signed display-url endpoint. A response needs, at minimum:

```ts
type ReviewFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  version?: string;
  submittedAt?: string;
  submittedBy?: string;
  previewKind: "image" | "pdf" | "external";
};

type FileDisplayUrl = {
  url: string;
  expiresAt?: string;
};
```

The endpoint must re-run authorization for every request. For a Board actor, that authorization is proposal-key-only: it permits a key attached to a Proposal visible in an active Board review state, and rejects every series, chapter, page, task, submission, and material key. The client must not reuse a display URL after its local expiry or after a `403`/`404` response.

## Error handling

- Network error: retain metadata and offer Retry.
- `401`: use the existing session-refresh/sign-in path; do not show a stale preview.
- `403`: show “You no longer have access to this file.” and close any active preview.
- `404`: show “This file is no longer available.”
- URL/preview failure: refresh once, then show retryable error.
- Unsupported MIME: use external open/share only, without attempting inline rendering.

## Testing

- Data-source tests verify the correct role/context request and that no URL is manufactured locally.
- Viewer tests verify URL acquisition on demand, refresh before local expiry, one retry after expiry-style failure, and a stable error after the retry fails.
- Screen tests cover image/PDF preview, unsupported files, empty state, and `403`/`404` states.
- Contract tests cover Editor and Board visibility boundaries; Board must never receive chapter/submission files.

## Documentation changes

- Update `mobile/README.md` with the new review capability and 900-second URL behavior.
- Update `mobile/MOBILE_AGENT_CONTEXT.md` with the new source-of-truth locations, file-access boundary, and signed-URL rules.
- Add the mobile file-review scope and role matrix to `docs/business-flows/11-file-management.md`, and link it from `docs/business-flows/INDEX.md`.
- Correct stale references in `MOBILE_AGENT_CONTEXT.md` to non-existent `docs/contracts`, `docs/product`, and `docs/stories` paths.
