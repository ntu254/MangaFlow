# AI Bubble Translation Contract

## Scope

Detect/whiten bubbles and render translated text.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant, AI Service

## Business rules

- Frontend does not call AI service directly.
- AI output stored as FileAsset.
- Do not store base64 in DB.

## API surface

`POST /api/pages/:pageId/ai/bubble-detect`
`POST /api/pages/:pageId/ai/bubble-process`
`POST /api/pages/:pageId/render-translated-image`

## Acceptance criteria

- AI regions created.
- Whitened image stored.
- Final translated image rendered on submit.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
