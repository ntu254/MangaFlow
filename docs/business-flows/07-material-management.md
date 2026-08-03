# Supporting Material attachments

Supporting Materials are optional reference attachments for a Proposal, Series, Chapter, or Page.
They are not a review object and have no lifecycle status of their own.

## Canonical rules

- Only the owning Mangaka may create, edit metadata, add a version, or delete an attachment.
- Assigned Editors/Tantou and Board members may read attachments when they can read the parent object.
- `DRAFT`, `ACTIVE`, `IN_REVIEW`, `APPROVED`, and `ARCHIVED` are not valid Material statuses.
- Supporting Materials never block Chapter submission, Tantou replacement, publication, or Proposal decisions.
- Review feedback belongs to the Proposal review, Chapter review, or Page/Region comments—not to a Material-specific annotation workflow.
- Manuscripts are Proposal versions and are shown separately from Supporting Materials.
- A submitted Proposal or Board VotingSession freezes the attachment list in its Proposal snapshot.

## API

| Operation | Endpoint | Actor |
|---|---|---|
| List visible attachments | `GET /api/materials` | Authenticated actor with parent visibility |
| Create attachment | `POST /api/materials` | Owning `MANGAKA` |
| Edit metadata | `PATCH /api/materials/:id` | Owning `MANGAKA` |
| Add file version | `POST /api/materials/:id/versions` | Owning `MANGAKA` |
| Delete attachment | `DELETE /api/materials/:id` | Owning `MANGAKA` |

The API rejects a `status` field. File versions retain stable IDs, durable `fileKey` values, uploader metadata, and timestamps.

## Data migration

`npm run migrate:material-attachments` is a dry run. It reports legacy records that will be changed:

- records with legacy `ARCHIVED` status are removed;
- all other retained records have top-level `status` and `metadata.status` removed.
- embedded Proposal Manuscript/Supporting Material arrays are cleaned with IDs,
  file metadata, and version history preserved.

`npm run migrate:material-attachments:apply` performs the reviewed migration. The apply command is intentionally not run automatically.
