import { AppError } from "../../../shared/errors/AppError.js";
export function assertMarkFixedTransition(status) {
    if (status !== "OPEN") {
        throw new AppError("Only open comments can be marked fixed", 409);
    }
}
export function assertMangakaVerifyTransition(status) {
    if (status !== "FIXED_BY_ASSISTANT") {
        throw new AppError("Mangaka verification requires Assistant fixed state", 409);
    }
}
export function assertEditorResolveTransition(status) {
    if (status !== "VERIFIED_BY_MANGAKA") {
        throw new AppError("Editor resolution requires Mangaka verification first", 409);
    }
}
export function assertEditorReopenTransition(status) {
    if (!["FIXED_BY_ASSISTANT", "VERIFIED_BY_MANGAKA"].includes(status)) {
        throw new AppError("Editor can reopen only fixed or verified comments", 409);
    }
}
//# sourceMappingURL=comment-transition.guard.js.map