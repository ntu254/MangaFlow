import { fireEvent, render, screen } from "@testing-library/react-native"
import { WorkItemCard } from "@/components/work-item-card"
import { WorkflowActionBar } from "@/components/workflow-action-bar"
import { EditorTodayScreen } from "@/screens/editor-today-screen"
import { BoardTodayScreen } from "@/screens/board-today-screen"
import { filterEditorInbox } from "@/screens/editor-workspace"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { colors } from "@/design/tokens"

const urgentProposalFixture: MobileWorkItem = {
  id: "PROPOSAL_REVIEW:p-001",
  kind: "PROPOSAL_REVIEW",
  entityType: "PROPOSAL",
  entityId: "p-001",
  status: "REVISION_REQUESTED",
  version: 2,
  title: "Neon District",
  subtitle: "Manuscript v2",
  priority: { level: "URGENT", reason: "Revision received", dueAt: null },
  blockers: [],
  actions: [
    { action: "CLAIM", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
    { action: "REJECT", enabled: false, disabledReason: "Claim first.", requiresConfirmation: true, requiresReason: true },
  ],
  summary: {},
}

const editorInboxFixture: MobileInbox = {
  role: "EDITOR",
  generatedAt: new Date().toISOString(),
  items: [urgentProposalFixture],
}

describe("Queue-first Today surfaces", () => {
  it("separates Priority, Reviews, and Publish without changing inbox order", () => {
    const items: MobileWorkItem[] = [
      urgentProposalFixture,
      { ...urgentProposalFixture, id: "comment", kind: "COMMENT_REVIEW", priority: { ...urgentProposalFixture.priority, level: "HIGH" } },
      { ...urgentProposalFixture, id: "chapter", kind: "CHAPTER_REVIEW", priority: { ...urgentProposalFixture.priority, level: "NORMAL" } },
      { ...urgentProposalFixture, id: "publish", kind: "PUBLICATION", priority: { ...urgentProposalFixture.priority, level: "NORMAL" } },
    ]

    expect(filterEditorInbox("priority", items).map(({ id }) => id)).toEqual(["PROPOSAL_REVIEW:p-001", "comment"])
    expect(filterEditorInbox("reviews", items).map(({ id }) => id)).toEqual(["PROPOSAL_REVIEW:p-001", "comment", "chapter"])
    expect(filterEditorInbox("publish", items).map(({ id }) => id)).toEqual(["publish"])
  })

  it("shows backend priority and opens detail without mutating from the card", () => {
    const onSelect = jest.fn()
    render(<WorkItemCard item={urgentProposalFixture} onSelect={onSelect} />)

    expect(screen.getByText("Revision received")).toBeVisible()
    // The card never exposes an action control — mutations happen on detail.
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull()

    fireEvent.press(screen.getByRole("button", { name: /open Neon District/i }))
    expect(onSelect).toHaveBeenCalledWith(urgentProposalFixture)
  })

  it("makes publication work explicit with a normalized chapter context", () => {
    const publication: MobileWorkItem = {
      id: "PUBLICATION:ch-s-berserk-prod-4",
      kind: "PUBLICATION",
      entityType: "CHAPTER",
      entityId: "ch-s-berserk-prod-4",
      title: "Echoes",
      subtitle: "Scheduled",
      status: "SCHEDULED",
      version: null,
      priority: { level: "NORMAL", reason: "Publication decision", dueAt: null },
      blockers: [],
      actions: [
        { action: "SCHEDULE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
        { action: "POSTPONE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
        { action: "PUBLISH", enabled: false, disabledReason: "Publication is scheduled for a future date; postpone first to publish now.", requiresConfirmation: true, requiresReason: false },
      ],
      summary: { scheduledAt: "2026-08-07T09:00:00.000Z" },
      chapterContext: {
        seriesId: "s-berserk-prod",
        seriesTitle: "Berserk: Lost Chapters",
        chapterId: "ch-s-berserk-prod-4",
        chapterNumber: 4,
        chapterTitle: "Echoes",
      },
    }

    render(<WorkItemCard item={publication} onSelect={jest.fn()} />)

    expect(screen.getByText("Publication · Chapter 4")).toBeVisible()
    expect(screen.getByText("Berserk: Lost Chapters")).toBeVisible()
    expect(screen.getByText("Echoes · Scheduled")).toBeVisible()
  })

  it("keeps publication actions compact, accessible, and single-line", () => {
    render(
      <WorkflowActionBar
        actions={[
          { action: "SCHEDULE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
          { action: "PUBLISH", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
          { action: "POSTPONE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
        ]}
        onAction={jest.fn()}
      />,
    )

    for (const label of ["Schedule publication", "Publish now", "Postpone"]) {
      expect(screen.getByRole("button", { name: label })).toHaveStyle({ minHeight: 44 })
      expect(screen.getByText(label).props.numberOfLines).toBe(1)
    }

    expect(screen.getByRole("button", { name: "Schedule publication" })).toHaveStyle({
      backgroundColor: colors.primary,
    })
    expect(screen.getByRole("button", { name: "Publish now" })).toHaveStyle({
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderWidth: 1,
    })
    expect(screen.getByRole("button", { name: "Postpone" })).toHaveStyle({
      backgroundColor: colors.surfaceContainer,
    })
  })

  it("removes active accents from disabled publication actions", () => {
    render(
      <WorkflowActionBar
        actions={[
          { action: "PUBLISH", enabled: false, disabledReason: "Readiness failed.", requiresConfirmation: true, requiresReason: false },
          { action: "POSTPONE", enabled: false, disabledReason: "Nothing scheduled.", requiresConfirmation: true, requiresReason: false },
        ]}
        onAction={jest.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Publish now" })).toHaveStyle({
      backgroundColor: colors.surfaceContainer,
      borderColor: colors.surfaceContainer,
    })
    expect(screen.getByText("Publish now")).toHaveStyle({ color: colors.textMuted })
    expect(screen.getByText("Postpone")).toHaveStyle({ color: colors.textMuted })
  })

  it("renders a success empty state without demo rows", () => {
    render(<EditorTodayScreen inbox={{ ...editorInboxFixture, items: [] }} />)
    expect(screen.getByText("No decisions need your attention.")).toBeVisible()
    expect(screen.queryByText("Demo data")).toBeNull()
  })

  it("lists Board vote work in backend order", () => {
    const boardInbox: MobileInbox = {
      role: "BOARD",
      generatedAt: new Date().toISOString(),
      items: [
        { ...urgentProposalFixture, id: "BOARD_VOTE:p-004", kind: "BOARD_VOTE", entityType: "VOTING_SESSION", title: "First" },
        { ...urgentProposalFixture, id: "BOARD_VOTE:p-005", kind: "BOARD_VOTE", entityType: "VOTING_SESSION", title: "Second" },
      ],
    }
    render(<BoardTodayScreen inbox={boardInbox} />)
    expect(screen.getByText("First")).toBeVisible()
    expect(screen.getByText("Second")).toBeVisible()
  })

  it("omits final tied session-finalization work while retaining actionable Board work", () => {
    const boardInbox: MobileInbox = {
      role: "BOARD",
      generatedAt: new Date().toISOString(),
      items: [
        {
          ...urgentProposalFixture,
          id: "SESSION_FINALIZE:final-tie",
          kind: "SESSION_FINALIZE",
          entityType: "VOTING_SESSION",
          entityId: "final-tie",
          title: "Final tied round",
          status: "TIED",
        },
        {
          ...urgentProposalFixture,
          id: "SESSION_FINALIZE:open-round",
          kind: "SESSION_FINALIZE",
          entityType: "VOTING_SESSION",
          entityId: "open-round",
          title: "Open round",
          status: "OPEN",
        },
        {
          ...urgentProposalFixture,
          id: "BOARD_REVOTE:active-revote",
          kind: "BOARD_REVOTE",
          entityType: "VOTING_SESSION",
          entityId: "active-revote",
          title: "Active re-vote",
          status: "OPEN",
        },
      ],
    }

    render(<BoardTodayScreen inbox={boardInbox} />)

    expect(screen.queryByText("Final tied round")).toBeNull()
    expect(screen.getByText("Open round")).toBeVisible()
    expect(screen.getByText("Active re-vote")).toBeVisible()
  })

  it("does not render an empty workflow action-bar container", () => {
    const rendered = render(<WorkflowActionBar actions={[]} onAction={jest.fn()} />)

    expect(rendered.toJSON()).toBeNull()
  })
})
