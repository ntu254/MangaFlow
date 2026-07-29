import { getReVoteBanner } from "./revote-banner";

function expectEqual<T>(actual: T, expected: T, description: string): void {
  if (actual !== expected) {
    throw new Error(`${description}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const freshRound = getReVoteBanner(
  { status: "OPEN", reVoteOfSessionId: "vs-prior-round" },
  "TIE_BREAK_REQUIRED",
);
expectEqual(freshRound?.kind, "fresh", "an open re-vote lineage must show the fresh-round banner");

const legacyRound = getReVoteBanner(undefined, "TIE_BREAK_REQUIRED");
expectEqual(legacyRound?.kind, "legacy", "legacy tie-break status must use historical wording");

const ordinaryRound = getReVoteBanner({ status: "OPEN" }, "PENDING");
expectEqual(ordinaryRound, null, "a normal open session must not show a re-vote banner");
