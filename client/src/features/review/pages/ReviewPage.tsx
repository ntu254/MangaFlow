import { useState } from "react"
import {
  ActionItemList,
  CommentThread,
  PublicationReadinessChecklist,
  ReviewDecisionBar,
  StatusBadge,
  SubmissionVersionList,
  type ActionItem,
  type CommentThreadItem,
  type PublicationReadinessItem,
  type SubmissionVersionItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import {
  MFBadge,
  MFCard,
  MFPagePreviewCard,
  MFTable,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  commentStatusUI,
  submissionStatusUI,
  taskStatusUI,
} from "@/shared/lib/status-ui"

interface ReviewQueueRow {
  id: string
  target: string
  series: string
  type: string
  status: string
  owner: string
  age: string
}

const reviewActions: ActionItem[] = [
  {
    id: "review-action-1",
    title: "Submission waiting for Mangaka review",
    description: "Tone cleanup version 2 is ready for internal review.",
    metadata: "Moonlit Atelier - Chapter 08 - Page 12",
    icon: "rate_review",
    status: "SUBMITTED",
  },
  {
    id: "review-action-2",
    title: "Unresolved comment blocks readiness",
    description: "One review note must be handled before publication can proceed.",
    metadata: "Publication readiness blocker",
    icon: "forum",
    status: "REVISION_REQUESTED",
  },
]

const reviewRows: ReviewQueueRow[] = [
  {
    id: "review-1",
    target: "Tone cleanup submission",
    series: "Moonlit Atelier",
    type: "Submission",
    status: "SUBMITTED",
    owner: "Mangaka review",
    age: "Today",
  },
  {
    id: "review-2",
    target: "Initial manuscript v3",
    series: "Paper Comet",
    type: "Manuscript",
    status: "REVISION_REQUESTED",
    owner: "Editor review",
    age: "Yesterday",
  },
  {
    id: "review-3",
    target: "Lettering alignment",
    series: "Moonlit Atelier",
    type: "Final approval",
    status: "MANGAKA_APPROVED",
    owner: "Editor final review",
    age: "2 days",
  },
]

const submissionVersions: SubmissionVersionItem[] = [
  {
    id: "submission-v2",
    label: "Version 2",
    submittedBy: "Assistant view",
    submittedAt: "Today 11:35",
    status: "SUBMITTED",
    summary: "Latest tone cleanup preview. This page does not submit, approve, or upload files.",
    fileName: "chapter-08-page-12-tone-pass-v2.psd",
    isCurrent: true,
  },
  {
    id: "submission-v1",
    label: "Version 1",
    submittedBy: "Assistant view",
    submittedAt: "Yesterday 18:10",
    status: "REVISION_REQUESTED",
    summary: "Earlier sample version retained to show non-overwrite history.",
    fileName: "chapter-08-page-12-tone-pass-v1.psd",
  },
]

const comments: CommentThreadItem[] = [
  {
    id: "comment-1",
    authorName: "Mika Tan",
    authorRole: "Mangaka",
    body: "Please soften the texture around the speech bubble before final approval.",
    status: "OPEN",
    createdAt: "Today 09:20",
    targetLabel: "Page 12 - upper panel",
    isUnresolved: true,
  },
  {
    id: "comment-2",
    authorName: "Rin Sato",
    authorRole: "Tantou Editor",
    body: "Panel rhythm is approved. Keep light direction consistent with the previous page.",
    status: "RESOLVED_BY_EDITOR",
    createdAt: "Yesterday 16:45",
    targetLabel: "Page 12 - full page",
  },
]

const readinessItems: PublicationReadinessItem[] = [
  {
    id: "pages-uploaded",
    label: "All pages uploaded",
    passed: true,
    description: "Local readiness sample only.",
  },
  {
    id: "tasks-approved",
    label: "All tasks approved",
    passed: false,
    description: "The selected review still has a submitted task awaiting approval.",
  },
  {
    id: "comments-resolved",
    label: "All comments resolved",
    passed: false,
    description: "Unresolved comments must be resolved by Editor before publication.",
  },
  {
    id: "publication-date",
    label: "Publication date exists",
    passed: true,
    description: "Sample schedule has a draft date.",
  },
]

const reviewColumns: MFTableColumn<ReviewQueueRow>[] = [
  {
    id: "target",
    header: "Review target",
    cell: (row) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{row.target}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          {row.series}
        </p>
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: (row) => row.type,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} mapping={submissionStatusUI} />,
  },
  {
    id: "owner",
    header: "Owner",
    cell: (row) => row.owner,
  },
  {
    id: "age",
    header: "Age",
    cell: (row) => row.age,
  },
]

function ReviewStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Review states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, resolved, submitted, and revision states.
          </p>
        </div>
        <MFBadge tone="warning" size="md">
          API not connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading review preview">
          <div className="h-4 w-32 rounded-full bg-surface-container" />
          <div className="mt-md space-y-sm">
            <div className="h-3 rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="rate_review"
          title="No reviews waiting"
          description="The live queue will stay empty until review APIs supply records."
        />
        <MFErrorState
          title="Could not load review queue"
          description="Future API failures should remain recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <StatusBadge status="SUBMITTED" mapping={submissionStatusUI} />
            <StatusBadge status="OPEN" mapping={commentStatusUI} />
            <StatusBadge status="RESOLVED_BY_EDITOR" mapping={commentStatusUI} />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Review, comment, and revision states stay text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

export function ReviewPage() {
  const [decisionPreview, setDecisionPreview] = useState("No local review decision selected.")

  usePageTitle(
    "Review Queue",
    "Review submissions, comments, and readiness without mutating workflow state.",
  )

  function recordDecision(label: string) {
    setDecisionPreview(`${label} selected locally. No review API call was sent.`)
  }

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Review
                </MFBadge>
                <MFBadge tone="warning" size="md">
                  Presentation only
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">
                Review queue
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page composes shared review components with local sample data.
                Review decisions, comment lifecycle changes, readiness updates,
                payroll triggers, file access, and API writes remain backend-owned.
              </p>
            </div>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Workflow boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Decision buttons below update local preview copy only. They do not
            approve, reject, request revision, resolve comments, or trigger payroll.
          </p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Pending review actions</h2>
          <ActionItemList items={reviewActions} statusMapping={taskStatusUI} />
        </div>
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Review queue</h2>
          <MFTable
            caption="Review queue"
            rows={reviewRows}
            columns={reviewColumns}
            getRowKey={(row) => row.id}
            emptyTitle="No review items"
            emptyDescription="Review records will appear here when a backend query is connected."
          />
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <ReviewDecisionBar
            title="Submission review decision"
            description="Preview the decision surface. Actions only update local copy in this story."
            approveLabel="Approve locally"
            requestRevisionLabel="Request revision locally"
            rejectLabel="Reject locally"
            rejectConfirmationTitle="Preview rejection?"
            rejectConfirmationDescription="This opens the shared destructive-action confirmation but will not reject a real submission."
            onApprove={() => recordDecision("Approve")}
            onRequestRevision={() => recordDecision("Request revision")}
            onReject={() => recordDecision("Reject")}
          />
          <MFCard>
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div>
                <h2 className="text-title-lg text-on-surface">Local decision preview</h2>
                <p className="mt-xs text-body-md text-on-surface-muted">
                  This text proves the decision controls are wired only to local state.
                </p>
              </div>
              <MFBadge tone="neutral" size="md">
                Local only
              </MFBadge>
            </div>
            <p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">
              {decisionPreview}
            </p>
          </MFCard>
          <SubmissionVersionList
            versions={submissionVersions}
            description="Version history preview only. Submission review mutation is reserved for an API-backed story."
          />
        </div>

        <div className="space-y-lg">
          <MFCard>
            <h2 className="text-title-lg text-on-surface">Review target</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              The selected target preview is local and does not fetch signed files.
            </p>
            <div className="mt-lg">
              <MFPagePreviewCard pageNumber={12} status="SUBMITTED" isSelected />
            </div>
          </MFCard>
          <PublicationReadinessChecklist
            items={readinessItems}
            description="Readiness blockers are shown as presentation data only."
          />
        </div>
      </section>

      <CommentThread
        comments={comments}
        description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions."
      />

      <ReviewStatePreview />
    </PageShell>
  )
}
