import { fireEvent, render, screen } from "@testing-library/react-native"
import { CommentThread, type MobileComment } from "@/components/comment-thread"
import { MobileApiError } from "@/services/mobile-api-error"

const resolveEnabled = {
  action: "COMMENT_RESOLVE",
  enabled: true,
  disabledReason: null,
  requiresConfirmation: true,
  requiresReason: false,
}
const reopenDisabled = {
  action: "COMMENT_REOPEN",
  enabled: false,
  disabledReason: "Only a resolved comment can be reopened.",
  requiresConfirmation: true,
  requiresReason: false,
}

const addressedBlockingComment: MobileComment = {
  id: "c-1",
  author: "Tanaka Akira",
  status: "ADDRESSED",
  isBlocking: true,
  targetLabel: "Page 3",
  body: "Fix the speech balloon.",
  actions: [resolveEnabled, reopenDisabled],
}

describe("CommentThread", () => {
  it("shows only the backend-enabled Tantou action", () => {
    render(<CommentThread comment={addressedBlockingComment} onResolve={jest.fn()} onReopen={jest.fn()} />)
    expect(screen.getByRole("button", { name: "Resolve comment" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Reopen comment" })).toBeDisabled()
    expect(screen.getByText("Only a resolved comment can be reopened.")).toBeVisible()
  })

  it("invokes resolve with the comment id", () => {
    const onResolve = jest.fn()
    render(<CommentThread comment={addressedBlockingComment} onResolve={onResolve} />)
    fireEvent.press(screen.getByRole("button", { name: "Resolve comment" }))
    expect(onResolve).toHaveBeenCalledWith("c-1")
  })

  it("keeps a reply draft after a 409", async () => {
    const onReply = jest.fn().mockRejectedValue(new MobileApiError("Comment changed.", 409, "CONFLICT"))
    render(<CommentThread comment={addressedBlockingComment} onReply={onReply} />)
    fireEvent.changeText(screen.getByLabelText("Reply"), "Please adjust the balloon.")
    fireEvent.press(screen.getByRole("button", { name: "Send reply" }))
    expect(
      await screen.findByText("This workflow changed. Refreshing current comment."),
    ).toBeVisible()
    expect(screen.getByDisplayValue("Please adjust the balloon.")).toBeVisible()
  })
})
