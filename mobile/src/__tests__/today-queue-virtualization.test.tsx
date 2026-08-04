import { render, screen } from "@testing-library/react-native"
import { TodayQueue } from "@/components/today-queue"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"

function workItem(id: string, title: string): MobileWorkItem {
  return {
    id,
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: id,
    status: "EDITOR_REVIEW",
    version: 1,
    title,
    subtitle: "Manuscript v1",
    priority: { level: "NORMAL", reason: "Awaiting review", dueAt: null },
    blockers: [],
    actions: [],
    summary: {},
  }
}

describe("TodayQueue virtualization", () => {
  it("does not mount every row of a long inbox up front", () => {
    const items = Array.from({ length: 60 }, (_, index) => workItem(`item-${index}`, `Item ${index}`))
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items }

    render(<TodayQueue inbox={inbox} emptyTitle="Empty" emptyDescription="Empty" context="Editor work" />)

    expect(screen.getByText("Item 0")).toBeVisible()
    // FlatList's default initialNumToRender (10) keeps rows far down the
    // list unmounted; a ScrollView + .map() would render all 60 up front.
    expect(screen.queryByText("Item 55")).toBeNull()
  })

  it("still renders every item when the inbox is small", () => {
    const items = [workItem("item-0", "Only item")]
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items }

    render(<TodayQueue inbox={inbox} emptyTitle="Empty" emptyDescription="Empty" context="Editor work" />)

    expect(screen.getByText("Only item")).toBeVisible()
  })

  it("shows the demo banner above the list content", () => {
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items: [workItem("item-0", "Item 0")] }

    render(
      <TodayQueue inbox={inbox} emptyTitle="Empty" emptyDescription="Empty" context="Editor work" demoMode />,
    )

    expect(screen.getByText("Demo data")).toBeVisible()
    expect(screen.getByText("Item 0")).toBeVisible()
  })

  it("shows the empty state instead of the list when there are no items", () => {
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items: [] }

    render(
      <TodayQueue inbox={inbox} emptyTitle="Nothing here" emptyDescription="Come back later" context="Editor work" />,
    )

    expect(screen.getByText("Nothing here")).toBeVisible()
    expect(screen.getByText("Come back later")).toBeVisible()
  })
})
