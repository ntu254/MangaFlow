import { useState } from "react"
import {
  ActionItemList,
  AtRiskBadge,
  DecisionBadge,
  RankingTable,
  ReviewDecisionBar,
  StatusBadge,
  VoteCard,
  type ActionItem,
  type RankingTableRow,
  type VoteCardOption,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import {
  MFBadge,
  MFCard,
  MFTable,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  boardDecisionStatusUI,
  rankingStatusUI,
  seriesStatusUI,
} from "@/shared/lib/status-ui"

interface BoardQueueRow {
  id: string
  seriesTitle: string
  owner: string
  status: string
  decisionStatus: string
  voteSummary: string
  age: string
}

const boardActions: ActionItem[] = [
  {
    id: "board-action-1",
    title: "Series approval vote pending",
    description: "Moonlit Atelier is awaiting Board summary review.",
    metadata: "Board approval queue",
    icon: "how_to_vote",
    status: "PENDING",
  },
  {
    id: "board-action-2",
    title: "Tie-break review needed",
    description: "A sample tie state is visible for Board Chair review.",
    metadata: "Tie-break preview only",
    icon: "balance",
    status: "TIE_BREAK_REQUIRED",
  },
]

const boardQueueRows: BoardQueueRow[] = [
  {
    id: "board-row-1",
    seriesTitle: "Moonlit Atelier",
    owner: "Rin Sato",
    status: "BOARD_REVIEW",
    decisionStatus: "PENDING",
    voteSummary: "2 approve / 2 reject",
    age: "Today",
  },
  {
    id: "board-row-2",
    seriesTitle: "Paper Comet",
    owner: "Mika Tan",
    status: "APPROVED",
    decisionStatus: "FINALIZED",
    voteSummary: "4 approve / 1 abstain",
    age: "Yesterday",
  },
  {
    id: "board-row-3",
    seriesTitle: "Glass Lantern",
    owner: "Nari Ito",
    status: "AT_RISK",
    decisionStatus: "TIE_BREAK_REQUIRED",
    voteSummary: "3 approve / 3 reject",
    age: "2 days",
  },
]

const rankingRows: RankingTableRow[] = [
  {
    id: "ranking-1",
    rank: 1,
    seriesTitle: "Moonlit Atelier",
    voteCount: 1280,
    readerScore: "9.1",
    finalScore: "94.2",
    status: "IMPORTED",
    periodLabel: "June 2026",
  },
  {
    id: "ranking-2",
    rank: 2,
    seriesTitle: "Paper Comet",
    voteCount: 980,
    readerScore: "8.7",
    finalScore: "88.4",
    status: "REVIEWED",
    periodLabel: "June 2026",
  },
  {
    id: "ranking-3",
    rank: 7,
    seriesTitle: "Glass Lantern",
    voteCount: 320,
    readerScore: "6.4",
    finalScore: "61.8",
    status: "FLAGGED",
    periodLabel: "June 2026",
  },
]

const boardColumns: MFTableColumn<BoardQueueRow>[] = [
  {
    id: "series",
    header: "Series",
    cell: (row) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{row.seriesTitle}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          Owner: {row.owner}
        </p>
      </div>
    ),
  },
  {
    id: "series-status",
    header: "Series status",
    cell: (row) => <StatusBadge status={row.status} mapping={seriesStatusUI} />,
  },
  {
    id: "decision",
    header: "Decision",
    cell: (row) => <DecisionBadge status={row.decisionStatus} />,
  },
  {
    id: "votes",
    header: "Vote summary",
    cell: (row) => row.voteSummary,
  },
  {
    id: "age",
    header: "Age",
    cell: (row) => row.age,
  },
]

function BoardStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Board states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, pending, tie-break, imported,
            finalized, and at-risk states.
          </p>
        </div>
        <MFBadge tone="warning" size="md">
          API not connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading board preview">
          <div className="h-4 w-32 rounded-full bg-surface-container" />
          <div className="mt-md space-y-sm">
            <div className="h-3 rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="how_to_vote"
          title="No Board items"
          description="The live Board queue will stay empty until Board APIs supply records."
        />
        <MFErrorState
          title="Could not load Board queue"
          description="Future API failures should remain recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <DecisionBadge status="PENDING" />
            <DecisionBadge status="TIE_BREAK_REQUIRED" />
            <StatusBadge status="IMPORTED" mapping={rankingStatusUI} />
            <AtRiskBadge status="AT_RISK" />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Board statuses stay text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

export function BoardPage() {
  const [votePreview, setVotePreview] = useState("No local vote preview selected.")
  const [atRiskPreview, setAtRiskPreview] = useState("No local at-risk action selected.")

  usePageTitle(
    "Board Review",
    "Review approval, ranking, tie-break, and at-risk presentation states.",
  )

  function recordVote(label: string) {
    setVotePreview(`${label} vote selected locally. No Board vote API call was sent.`)
  }

  function recordAtRisk(label: string) {
    setAtRiskPreview(`${label} selected locally. No at-risk decision API call was sent.`)
  }

  const voteOptions: VoteCardOption[] = [
    {
      id: "approve",
      label: "Approve",
      description: "Sample vote option. Does not approve the Series.",
      countLabel: "2 votes",
      icon: "thumb_up",
      onVote: () => recordVote("Approve"),
    },
    {
      id: "reject",
      label: "Reject",
      description: "Sample vote option. Does not reject the Series.",
      countLabel: "2 votes",
      icon: "thumb_down",
      onVote: () => recordVote("Reject"),
    },
    {
      id: "abstain",
      label: "Abstain",
      description: "Sample vote option. Does not submit an abstention.",
      countLabel: "1 vote",
      icon: "remove_circle",
      onVote: () => recordVote("Abstain"),
    },
  ]

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Editorial Board
                </MFBadge>
                <MFBadge tone="warning" size="md">
                  Presentation only
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">
                Board review
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page composes shared Board components with local sample data.
                Vote submission, majority calculation, tie-break finalization,
                ranking import, at-risk decisions, and Admin override behavior remain
                backend-owned or forbidden.
              </p>
            </div>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Decision boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            The UI below previews Board surfaces only. It does not decide whether
            a Series is approved, rejected, tied, or eligible for chapter creation.
          </p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Board actions</h2>
          <ActionItemList items={boardActions} statusMapping={boardDecisionStatusUI} />
        </div>
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Approval queue</h2>
          <MFTable
            caption="Board approval queue"
            rows={boardQueueRows}
            columns={boardColumns}
            getRowKey={(row) => row.id}
            emptyTitle="No Board queue items"
            emptyDescription="Board records will appear here when a backend query is connected."
          />
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <VoteCard
            title="Series approval vote"
            description="Local vote preview for a pending Series approval. No majority or tie-break is calculated in the client."
            options={voteOptions}
            resultLabel="Tie preview"
            totalVotesLabel="5 supplied votes"
            tieBreakRequired
            boardChairNote="Board Chair tie-break is displayed as caller-supplied state only."
          />
          <MFCard>
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div>
                <h2 className="text-title-lg text-on-surface">Local vote preview</h2>
                <p className="mt-xs text-body-md text-on-surface-muted">
                  This text proves vote controls are wired only to local state.
                </p>
              </div>
              <MFBadge tone="neutral" size="md">
                Local only
              </MFBadge>
            </div>
            <p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">
              {votePreview}
            </p>
          </MFCard>
        </div>

        <div className="space-y-lg">
          <MFCard>
            <h2 className="text-title-lg text-on-surface">Decision status</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              Statuses are caller-supplied display values. Admin override is not
              available on this page.
            </p>
            <div className="mt-lg flex flex-wrap gap-sm">
              <DecisionBadge status="PENDING" size="md" />
              <DecisionBadge status="TIE_BREAK_REQUIRED" size="md" />
              <DecisionBadge status="FINALIZED" size="md" />
            </div>
          </MFCard>
          <MFCard>
            <h2 className="text-title-lg text-on-surface">At-risk status</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              At-risk decisions are shown as local presentation data only.
            </p>
            <div className="mt-lg flex flex-wrap gap-sm">
              <AtRiskBadge status="WATCHLIST" size="md" />
              <AtRiskBadge status="AT_RISK" size="md" />
              <AtRiskBadge status="RESOLVED" size="md" />
            </div>
          </MFCard>
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Ranking preview</h2>
          <RankingTable rows={rankingRows} />
        </div>
        <div className="space-y-lg">
          <ReviewDecisionBar
            title="At-risk action preview"
            description="Preview confirmation behavior only. This does not mark a Series at risk."
            approveLabel="Keep stable locally"
            requestRevisionLabel="Watchlist locally"
            rejectLabel="Mark at risk locally"
            rejectConfirmationTitle="Preview at-risk decision?"
            rejectConfirmationDescription="This confirms a local preview action only and will not update Board records."
            onApprove={() => recordAtRisk("Keep stable")}
            onRequestRevision={() => recordAtRisk("Watchlist")}
            onReject={() => recordAtRisk("Mark at risk")}
          />
          <MFCard>
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div>
                <h2 className="text-title-lg text-on-surface">Local at-risk preview</h2>
                <p className="mt-xs text-body-md text-on-surface-muted">
                  Confirmation updates this copy only.
                </p>
              </div>
              <MFBadge tone="neutral" size="md">
                Local only
              </MFBadge>
            </div>
            <p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">
              {atRiskPreview}
            </p>
          </MFCard>
        </div>
      </section>

      <BoardStatePreview />
    </PageShell>
  )
}
