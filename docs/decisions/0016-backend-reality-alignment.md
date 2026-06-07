# 0016 Backend Reality Alignment

Date: 2026-06-08

## Status

Accepted

## Context

The MangaFlow backend series module was implemented with direct Mongoose calls from the service layer, while the intended architecture requires repository-based data access. This created drift between documented contract and implementation, increased coupling, and made future testing and refactoring harder.

In addition, the existing `SeriesStatus` union had drifted away from the production-only MVP status set defined in product and workflow docs. Some implementation-only statuses needed clarification, while statuses that belong to Chapter/Publication needed to be kept out of the series domain.

Finally, an initial implementation attempt accidentally included an unrelated `server/src/modules/auth/auth.service.ts` change inside the same working tree. Keeping unrelated auth changes in a backend reality alignment story would have polluted scope and review surface.

## Decision

1. Accept Controller-Service-Repository as the target internal architecture.
2. Do not rename folders or restructure the repository root.
3. Apply the new pattern module-by-module, starting with `series`.
4. Update the series module to use `series.repository.ts` for all Mongoose calls, keep business rules in service, and keep request handling in controller.
5. Align `SeriesStatus` in `series.model.ts` to the production-only MVP set and remove/avoid statuses that belong to Chapter or Publication.
6. Keep auth logic out of MF-HIOS-003 scope; remove auth service changes via a separate cleanup commit before merging the story back to `new`.

## Alternatives Considered

1. Keep the existing direct-Mongoose service pattern for compatibility and lower refactor cost.
2. Perform a large repository migration across all modules at once.
3. Repo-wide folder restructure to a new layering boundary.
4. Keep the auth service change inside this story to avoid another commit.

## Consequences

Positive:
- `series` module now matches the documented architecture.
- Future stories can follow a proven pattern with `series` as a template.
- Status drift between docs and implementation is reduced.
- Branch and review scope stay cleaner by excluding unrelated auth edits.

Tradeoffs:
- Only one backend module has been migrated; other modules still use direct model access.
- Tests are improved but do not yet provide full build/test proof because of pre-existing toolchain typing issues unrelated to this story.
- Enforcement of the repository pattern relies on contributor discipline until lint/architecture checks are added.

## Follow-Up

- Follow the same Controller-Service-Repository alignment for manuscript, board, chapter, task, submission, and remaining modules.
- Revisit build/test infrastructure separately so future stories can include full automated proof.
- Keep the repo root structure as-is and use internal module refactor only.
