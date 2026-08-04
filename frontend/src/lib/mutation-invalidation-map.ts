/**
 * Sprint 3.5 (CACHE-001) — central registry of mutation -> query-key sets.
 *
 * Components previously called queryClient.invalidateQueries inline with
 * bespoke key lists. The downside: a new view added later had no signal to
 * invalidate, and the same key set was duplicated across mutations.
 *
 * This file is the single source of truth. Each entry is the mutation name
 * (we already emit these from service code), and the value is the union of
 * query-key sets that must be invalidated. Components should look up the
 * list and call queryClient.invalidateQueries(items) instead of building
 * their own list. The pure-function style here means contract tests can
 * assert reachability without standing up React.
 */
export type MutationName =
  | "task.submit"
  | "task.accept"
  | "task.reject"
  | "task.start"
  | "task.cancel"
  | "task.reopen"
  | "task.reassign"
  | "submission.approve"
  | "submission.request-revision"
  | "submission.reject"
  | "chapter.start-draft"
  | "chapter.send-editor-review"
  | "chapter.editor-approve"
  | "chapter.request-revision"
  | "chapter.schedule"
  | "chapter.postpone"
  | "chapter.publish"
  | "chapter.reassign"
  | "page-assignment.assign"
  | "page-assignment.accept"
  | "page-assignment.reject"
  | "page-assignment.release"
  | "page.create"
  | "page.update"
  | "page.delete"
  | "region.create"
  | "region.update"
  | "region.delete"
  | "series.update"
  | "series.start-production"
  | "series.archive"
  | "series.member.invite"
  | "series.member.update"
  | "series.member.remove"
  | "proposal.create"
  | "proposal.submit"
  | "proposal.claim"
  | "proposal.release-claim"
  | "proposal.request-changes"
  | "proposal.resubmit"
  | "proposal.forward"
  | "proposal.reject"
  | "proposal.archive"
  | "voting-session.create"
  | "voting-session.vote"
  | "voting-session.close"
  | "voting-session.cancel"
  | "voting-session.resolve-tie"
  | "ranking.import"
  | "at-risk.decision"
  | "comment.create"
  | "comment.address"
  | "comment.resolve"
  | "comment.reopen"
  | "review.approve"
  | "review.request-revision"
  | "review.reject";

export interface InvalidationEntry {
  keys: readonly string[];
}

const INVENTORY: Record<MutationName, InvalidationEntry> = {
  "task.submit": { keys: ["studio", "submissions"] },
  "task.accept": { keys: ["studio", "submissions"] },
  "task.reject": { keys: ["studio", "submissions"] },
  "task.start": { keys: ["studio", "submissions"] },
  "task.cancel": { keys: ["studio", "submissions"] },
  "task.reopen": { keys: ["studio", "submissions"] },
  "task.reassign": { keys: ["studio", "submissions"] },
  "submission.approve": { keys: ["studio", "submissions", "earnings"] },
  "submission.request-revision": { keys: ["studio", "submissions"] },
  "submission.reject": { keys: ["studio", "submissions"] },
  "chapter.start-draft": { keys: ["chapters", "series", "studio"] },
  "chapter.send-editor-review": { keys: ["chapters", "submissions", "studio"] },
  "chapter.editor-approve": { keys: ["chapters", "publications", "submissions"] },
  "chapter.request-revision": { keys: ["chapters", "submissions"] },
  "chapter.schedule": { keys: ["chapters", "publications"] },
  "chapter.postpone": { keys: ["chapters", "publications"] },
  "chapter.publish": { keys: ["chapters", "publications", "reader"] },
  "chapter.reassign": { keys: ["chapters", "studio"] },
  "page-assignment.assign": { keys: ["studio", "pages"] },
  "page-assignment.accept": { keys: ["studio", "pages", "tasks"] },
  "page-assignment.reject": { keys: ["studio", "pages", "tasks"] },
  "page-assignment.release": { keys: ["studio", "pages", "tasks"] },
  "page.create": { keys: ["pages", "chapters"] },
  "page.update": { keys: ["pages", "chapters"] },
  "page.delete": { keys: ["pages", "chapters"] },
  "region.create": { keys: ["regions", "pages"] },
  "region.update": { keys: ["regions", "pages"] },
  "region.delete": { keys: ["regions", "pages"] },
  "series.update": { keys: ["series"] },
  "series.start-production": { keys: ["series"] },
  "series.archive": { keys: ["series", "publications"] },
  "series.member.invite": { keys: ["series"] },
  "series.member.update": { keys: ["series"] },
  "series.member.remove": { keys: ["series", "studio"] },
  "proposal.create": { keys: ["proposals", "board"] },
  "proposal.submit": { keys: ["proposals", "board"] },
  "proposal.claim": { keys: ["proposals", "board"] },
  "proposal.release-claim": { keys: ["proposals", "board"] },
  "proposal.request-changes": { keys: ["proposals"] },
  "proposal.resubmit": { keys: ["proposals"] },
  "proposal.forward": { keys: ["proposals", "board"] },
  "proposal.reject": { keys: ["proposals", "board"] },
  "proposal.archive": { keys: ["proposals"] },
  "voting-session.create": { keys: ["proposals", "board", "votingSessions"] },
  "voting-session.vote": { keys: ["proposals", "votingSessions"] },
  "voting-session.close": { keys: ["proposals", "votingSessions", "series"] },
  "voting-session.cancel": { keys: ["proposals", "votingSessions"] },
  "voting-session.resolve-tie": { keys: ["proposals", "votingSessions"] },
  "ranking.import": { keys: ["rankings", "board", "series"] },
  "at-risk.decision": { keys: ["rankings", "board", "series"] },
  "comment.create": { keys: ["comments"] },
  "comment.address": { keys: ["comments", "chapters"] },
  "comment.resolve": { keys: ["comments", "chapters"] },
  "comment.reopen": { keys: ["comments", "chapters"] },
  "review.approve": { keys: ["chapters", "submissions"] },
  "review.request-revision": { keys: ["chapters", "submissions"] },
  "review.reject": { keys: ["chapters", "submissions"] },
};

export function invalidationsFor(mutation: MutationName): readonly string[] {
  return INVENTORY[mutation]?.keys ?? [];
}

export function allMutations(): readonly MutationName[] {
  return Object.keys(INVENTORY) as MutationName[];
}
