# Component Design Specification

## UI primitives

- MFButton
- MFCard
- MFBadge
- MFInput
- MFSelect
- MFTextarea
- MFDialog
- MFTable
- MFTabs
- MFProgress
- MFIconCircle
- MFUploadBox

## Manga-specific components

- PagePreviewCard
- ManuscriptPreview
- RegionOverlay
- TaskCard
- TaskStatusBadge
- SubmissionReviewPanel
- CommentThread
- ReviewDecisionBar
- RankingTable
- PayrollSummaryCard
- AIProcessingPanel
- BubbleTranslationEditor

## Reuse rules

- Do not create one-off buttons/cards if existing primitive fits.
- Feature components must use shared primitives.
- Status colors must use centralized status map.
