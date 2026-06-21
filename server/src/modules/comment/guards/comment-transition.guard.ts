import { AppError } from "../../../shared/errors/AppError.js"

export function assertMarkFixedTransition(status: string) {
  if (!["OPEN", "REOPENED"].includes(status)) {
    throw new AppError("Only open or reopened comments can be marked as fixed", 409)
  }
}

export function assertMangakaVerifyTransition(status: string) {
  if (status !== "FIXED") {
    throw new AppError("Mangaka verification requires a fixed comment (assistant must mark fixed first)", 409)
  }
}

export function assertEditorResolveTransition(status: string) {
  if (!["OPEN", "REOPENED", "FIXED", "RESOLVED"].includes(status)) {
    throw new AppError("Editor can resolve only an active or fixed comment", 409)
  }
}

export function assertEditorReopenTransition(status: string) {
  if (!["FIXED", "RESOLVED"].includes(status)) {
    throw new AppError("Editor can reopen only fixed or resolved comments", 409)
  }
}
