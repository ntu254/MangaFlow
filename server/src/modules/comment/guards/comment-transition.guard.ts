import { AppError } from "../../../shared/errors/AppError.js"

export function assertMarkFixedTransition(status: string) {
  if (!["OPEN", "REOPENED"].includes(status)) {
    throw new AppError("Only open or reopened comments can be resolved", 409)
  }
}

export function assertMangakaVerifyTransition(status: string) {
  if (status !== "RESOLVED") {
    throw new AppError("Mangaka verification requires a resolved comment", 409)
  }
}

export function assertEditorResolveTransition(status: string) {
  if (!["OPEN", "REOPENED", "RESOLVED"].includes(status)) {
    throw new AppError("Editor can resolve only an active comment", 409)
  }
}

export function assertEditorReopenTransition(status: string) {
  if (status !== "RESOLVED") {
    throw new AppError("Editor can reopen only resolved comments", 409)
  }
}
