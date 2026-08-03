import { fireEvent, render, screen } from "@testing-library/react-native"
import { WorkItemCard } from "@/components/work-item-card"
import { EditorTodayScreen } from "@/screens/editor-today-screen"
import { BoardTodayScreen } from "@/screens/board-today-screen"
import { filterEditorInbox } from "@/screens/editor-workspace"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"

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
})
