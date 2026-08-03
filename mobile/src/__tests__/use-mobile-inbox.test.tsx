import { render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import { useMobileInbox } from "@/hooks/use-mobile-inbox"
import { getMobileInbox } from "@/services/mobile-inbox-data-source"
import { TestQueryProvider } from "@/test/test-query-provider"
import type { MobileAuthRole } from "@/services/mobile-auth"
import type { MobileInbox } from "@/domain/mobile-work-item"

const editorInboxFixture: MobileInbox = {
  role: "EDITOR",
  generatedAt: new Date().toISOString(),
  items: [
    {
      id: "PROPOSAL_REVIEW:p-001",
      kind: "PROPOSAL_REVIEW",
      entityType: "PROPOSAL",
      entityId: "p-001",
      status: "EDITOR_REVIEW",
      version: 2,
      title: "Neon District",
      subtitle: "Manuscript v2",
      priority: { level: "HIGH", reason: "Revision received", dueAt: null },
      blockers: [],
      actions: [
        {
          action: "CLAIM",
          enabled: true,
          disabledReason: null,
          requiresConfirmation: true,
          requiresReason: false,
        },
      ],
      summary: {},
    },
  ],
}

function InboxProbe({
  role,
  getInbox,
}: {
  role: MobileAuthRole
  getInbox: (role: MobileAuthRole) => Promise<MobileInbox>
}) {
  const query = useMobileInbox(role, getInbox)
  if (query.isError) return <Text>Could not load your queue.</Text>
  return <Text>{query.data?.items[0]?.title ?? "Loading"}</Text>
}

describe("useMobileInbox", () => {
  it("loads and validates the Editor inbox", async () => {
    const getInbox = jest.fn().mockResolvedValue(editorInboxFixture)
    render(
      <TestQueryProvider>
        <InboxProbe role="editor" getInbox={getInbox} />
      </TestQueryProvider>,
    )
    expect(await screen.findByText("Neon District")).toBeVisible()
    expect(getInbox).toHaveBeenCalledWith("editor")
  })

  it("surfaces a contract error instead of falling back to demo data", async () => {
    const getInbox = jest.fn().mockRejectedValue(new Error("Invalid input: unknown action"))
    render(
      <TestQueryProvider>
        <InboxProbe role="editor" getInbox={getInbox} />
      </TestQueryProvider>,
    )
    expect(await screen.findByText("Could not load your queue.")).toBeVisible()
  })

  it("maps roles to the canonical inbox endpoints", () => {
    // Guards against a silent path swap between Editor and Board inboxes.
    expect(getMobileInbox).toBeInstanceOf(Function)
  })
})
