import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Text } from "react-native"
import { NotificationsScreen } from "@/screens/notifications-screen"
import { MangaFlowMobileApp, boardTabs, editorTabs } from "@/MangaFlowMobileApp"
import { MFScreen } from "@/components/mf"
import { TestQueryProvider } from "@/test/test-query-provider"
import { MobileApiError } from "@/services/mobile-api-error"
import { MobileRequestError } from "@/services/mobile-request-diagnostics"
import { mobileApi } from "@/services/mobile-api-client"
import { getMobileNotifications } from "@/services/mobile-notification-data-source"
import {
  formatNotificationTime,
  mobileNotificationListSchema,
  unreadNotificationCount,
  type MobileNotification,
} from "@/domain/mobile-notification"
import type { MobileAuthSession } from "@/services/mobile-auth"

const unreadNotification: MobileNotification = {
  id: "n-1",
  kind: "PROPOSAL_FORWARDED",
  title: "Proposal forwarded to Board",
  message: "Neon District is now waiting on a Board session.",
  priority: "HIGH",
  createdAt: new Date().toISOString(),
  readAt: null,
}

const readNotification: MobileNotification = {
  id: "n-2",
  kind: "CHAPTER_APPROVED",
  title: "Chapter approved",
  message: "Chapter 12 passed editorial review.",
  priority: "NORMAL",
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  readAt: new Date().toISOString(),
}

type NotificationPage = {
  items: MobileNotification[]
  page: number
  totalPages: number
  unreadTotal: number
}

function notificationPage(
  items: MobileNotification[],
  { page = 1, totalPages = 1, unreadTotal = unreadNotificationCount(items) } = {},
): NotificationPage {
  return { items, page, totalPages, unreadTotal }
}

function renderScreen(overrides: {
  list?: (page: number) => Promise<NotificationPage>
  markRead?: (id: string) => Promise<MobileNotification>
}) {
  return render(
    <TestQueryProvider>
      <NotificationsScreen {...overrides} />
    </TestQueryProvider>,
  )
}

describe("notification contract", () => {
  it("never carries actionUrl into the app", () => {
    const parsed = mobileNotificationListSchema.parse([
      {
        id: "n-1",
        kind: "PROPOSAL_FORWARDED",
        title: "Proposal forwarded",
        message: "Waiting on the Board.",
        priority: "HIGH",
        createdAt: "2026-08-03T09:00:00.000Z",
        readAt: null,
        actionUrl: "https://mangaflow.local/proposals/p-001",
        userId: "u-1",
      },
    ])

    expect(parsed[0]).not.toHaveProperty("actionUrl")
    expect(parsed[0]).not.toHaveProperty("userId")
  })

  it("derives the unread count from live data", () => {
    expect(unreadNotificationCount([unreadNotification, readNotification])).toBe(1)
    expect(unreadNotificationCount([])).toBe(0)
  })

  it("formats notification time without a raw timestamp", () => {
    const now = Date.parse("2026-08-03T12:00:00.000Z")
    expect(formatNotificationTime("2026-08-03T11:58:00.000Z", now)).toBe("2m ago")
    expect(formatNotificationTime("2026-08-03T09:00:00.000Z", now)).toBe("3h ago")
    expect(formatNotificationTime("2026-07-20T09:00:00.000Z", now)).toBe("2026-07-20")
    expect(formatNotificationTime(null, now)).toBe("—")
  })

  it("validates notification page metadata from the success envelope", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            data: [unreadNotification],
            pagination: { page: 2, pageSize: 50, limit: 50, total: 51, totalPages: 2 },
            unreadTotal: 37,
          },
        }),
        { status: 200, headers: { "x-request-id": "req-notifications-2" } },
      ),
    ) as unknown as typeof fetch

    await expect(getMobileNotifications(2)).resolves.toEqual({
      items: [unreadNotification],
      page: 2,
      totalPages: 2,
      unreadTotal: 37,
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/notifications?page=2"),
      expect.any(Object),
    )
  })

  afterEach(() => {
    mobileApi.setAccessToken(null)
    mobileApi.setRefreshHandler(null)
    jest.restoreAllMocks()
  })
})

describe("NotificationsScreen", () => {
  it("renders title, message, kind, priority, time, and read state", async () => {
    renderScreen({ list: async () => notificationPage([unreadNotification, readNotification]) })

    expect(await screen.findByText("Proposal forwarded to Board")).toBeVisible()
    expect(screen.getByText("Neon District is now waiting on a Board session.")).toBeVisible()
    expect(screen.getByText("PROPOSAL FORWARDED")).toBeVisible()
    expect(screen.getByText("HIGH")).toBeVisible()
    expect(screen.getByText("Just now")).toBeVisible()
    expect(screen.getByText("Tap to mark as read")).toBeVisible()
    expect(screen.getByText("Read")).toBeVisible()
    expect(screen.getByText("1 unread")).toBeVisible()
  })

  it("shows an explicit loading surface before the first page arrives", async () => {
    let release: (value: NotificationPage) => void = () => {}
    const list = () =>
      new Promise<NotificationPage>((resolve) => {
        release = resolve
      })
    renderScreen({ list })

    expect(screen.getByText("Loading your notifications…")).toBeVisible()

    release(notificationPage([unreadNotification]))
    expect(await screen.findByText("Proposal forwarded to Board")).toBeVisible()
    expect(screen.queryByText("Loading your notifications…")).toBeNull()
  })

  it("shows an empty state instead of an unexplained blank list", async () => {
    renderScreen({ list: async () => notificationPage([]) })

    expect(await screen.findByText("No notifications yet.")).toBeVisible()
    expect(screen.getByText("All caught up.")).toBeVisible()
  })

  it("surfaces a recoverable error with safe support details", async () => {
    const list = jest.fn().mockRejectedValue(
      new MobileRequestError({
        context: "your notifications",
        category: "HTTP",
        status: 500,
        code: "INTERNAL",
        requestId: "req-5",
      }),
    )
    renderScreen({ list })

    expect(await screen.findByText("Could not load your notifications.")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Support details" }))
    expect(screen.getByText(/Request ID: req-5/)).toBeVisible()

    fireEvent.press(screen.getByRole("button", { name: "Retry" }))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
  })

  it("marks only the tapped notification as read", async () => {
    const markRead = jest.fn().mockResolvedValue({ ...unreadNotification, readAt: new Date().toISOString() })
    const list = jest
      .fn()
      .mockResolvedValueOnce(notificationPage([unreadNotification, readNotification]))
      .mockResolvedValue(
        notificationPage(
          [{ ...unreadNotification, readAt: new Date().toISOString() }, readNotification],
          { unreadTotal: 0 },
        ),
      )

    renderScreen({ list, markRead })

    fireEvent.press(
      await screen.findByRole("button", { name: "Proposal forwarded to Board, unread" }),
    )

    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(1))
    expect(markRead.mock.calls[0][0]).toBe("n-1")
    // The list refreshes from the server, dropping the unread badge count.
    expect(await screen.findByText("All caught up.")).toBeVisible()
  })

  it("never marks anything read just by opening the tab", async () => {
    const markRead = jest.fn()
    renderScreen({
      list: async () => notificationPage([unreadNotification, readNotification]),
      markRead,
    })

    expect(await screen.findByText("Proposal forwarded to Board")).toBeVisible()
    expect(markRead).not.toHaveBeenCalled()
  })

  it("cannot re-mark an already read notification", async () => {
    const markRead = jest.fn()
    renderScreen({ list: async () => notificationPage([readNotification]), markRead })

    const row = await screen.findByRole("button", { name: "Chapter approved, read" })
    expect(row.props.accessibilityState.disabled).toBe(true)
    fireEvent.press(row)
    expect(markRead).not.toHaveBeenCalled()
  })

  it("keeps a notification unread and offers a retry when the read fails", async () => {
    const markRead = jest
      .fn()
      .mockRejectedValueOnce(new MobileApiError("Notification not found.", 404, "NOTIFICATION_NOT_FOUND"))
      .mockResolvedValue({ ...unreadNotification, readAt: new Date().toISOString() })

    renderScreen({ list: async () => notificationPage([unreadNotification]), markRead })

    fireEvent.press(
      await screen.findByRole("button", { name: "Proposal forwarded to Board, unread" }),
    )

    expect(await screen.findByText("Notification not found.")).toBeVisible()
    expect(screen.getByText("1 unread")).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Proposal forwarded to Board, unread" }).props
        .accessibilityState.disabled,
    ).toBe(false)

    fireEvent.press(
      screen.getByRole("button", { name: "Retry marking Proposal forwarded to Board as read" }),
    )
    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(2))
  })

  it("loads a second page, renders both pages, and shows the server unread total", async () => {
    const pageTwoNotification = {
      ...readNotification,
      id: "n-51",
      title: "Publication scheduled",
      message: "Chapter 13 is scheduled for tomorrow.",
    }
    const list = jest.fn(async (page: number) =>
      page === 1
        ? notificationPage([unreadNotification], { page: 1, totalPages: 2, unreadTotal: 37 })
        : notificationPage([pageTwoNotification], { page: 2, totalPages: 2, unreadTotal: 37 }),
    )

    renderScreen({ list })

    expect(await screen.findByText("Proposal forwarded to Board")).toBeVisible()
    expect(screen.getByText("37 unread")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Load more notifications" }))

    expect(await screen.findByText("Publication scheduled")).toBeVisible()
    expect(screen.getByText("Proposal forwarded to Board")).toBeVisible()
    expect(list).toHaveBeenNthCalledWith(1, 1)
    expect(list).toHaveBeenNthCalledWith(2, 2)
    expect(screen.queryByRole("button", { name: "Load more notifications" })).toBeNull()
  })

  it("refreshes every loaded notification page after marking one as read", async () => {
    let markedRead = false
    const pageTwoNotification = { ...unreadNotification, id: "n-51", title: "Chapter revised" }
    const list = jest.fn(async (page: number) =>
      notificationPage(
        page === 1
          ? [{ ...unreadNotification, readAt: markedRead ? new Date().toISOString() : null }]
          : [pageTwoNotification],
        { page, totalPages: 2, unreadTotal: markedRead ? 1 : 2 },
      ),
    )
    const markRead = jest.fn(async () => {
      markedRead = true
      return { ...unreadNotification, readAt: new Date().toISOString() }
    })

    renderScreen({ list, markRead })
    fireEvent.press(await screen.findByRole("button", { name: "Load more notifications" }))
    expect(await screen.findByText("Chapter revised")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Proposal forwarded to Board, unread" }))

    expect(await screen.findByText("1 unread")).toBeVisible()
    await waitFor(() => {
      expect(list.mock.calls.filter(([page]) => page === 1)).toHaveLength(2)
      expect(list.mock.calls.filter(([page]) => page === 2)).toHaveLength(2)
    })
  })
})

describe("notification navigation entry", () => {
  const sessions: Array<[string, MobileAuthSession, string[]]> = [
    [
      "Editor",
      {
        user: { id: "u-editor", name: "Tanaka Akira", email: "editor@mangaflow.local", role: "EDITOR" },
        accessToken: "access",
        refreshToken: "refresh",
        role: "editor",
      },
      ["Home", "Reviews", "Publish", "History", "Notifications"],
    ],
    [
      "Board",
      {
        user: { id: "u-board", name: "Board Chair", email: "board@mangaflow.local", role: "BOARD", isChair: true },
        accessToken: "access",
        refreshToken: "refresh",
        role: "board",
      },
      ["Today", "Sessions", "Ranking", "History", "Notifications"],
    ],
  ]

  it.each(sessions)("gives %s Notifications as the fifth tab", async (_role, session, labels) => {
    render(<MangaFlowMobileApp initialSession={session} />)

    for (const label of labels) {
      expect(await screen.findByText(label)).toBeVisible()
    }
  })

  it("positions Notifications last in both role tab sets", () => {
    for (const tabs of [editorTabs, boardTabs]) {
      expect(tabs).toHaveLength(5)
      expect(tabs[4].id).toBe("notifications")
      expect(tabs[3].id).toBe("history")
    }
  })

  it("renders the unread count on the notifications tab, not the header", () => {
    render(
      <MFScreen
        tabs={editorTabs.map((tab) =>
          tab.id === "notifications" ? { ...tab, badgeCount: 4 } : tab,
        )}
        activeTab="priority"
        onTabChange={() => {}}
      >
        <Text>body</Text>
      </MFScreen>,
    )

    expect(screen.getByText("4")).toBeVisible()
    expect(screen.getByRole("button", { name: "Notifications, 4 unread" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Home" })).toBeVisible()
  })

  it("hides the badge when nothing is unread", () => {
    render(
      <MFScreen tabs={editorTabs} activeTab="priority" onTabChange={() => {}}>
        <Text>body</Text>
      </MFScreen>,
    )

    expect(screen.getByRole("button", { name: "Notifications" })).toBeVisible()
    expect(screen.queryByText("0")).toBeNull()
  })

  it("removes the decorative header bell and its hard-coded count", async () => {
    render(<MangaFlowMobileApp initialSession={sessions[0][1]} />)

    expect(await screen.findByText(/Home|Priority/)).toBeVisible()
    // The old header rendered a static "3" badge next to a non-interactive bell.
    expect(screen.queryByText("3")).toBeNull()
  })
})
