import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atRiskTitles,
  boardDecisionHistory,
  boardHome,
  boardRankings,
  boardSeries,
} from "@/data/board";
import type { AtRiskDecision, BoardVoteValue, SeriesProposalSummary } from "@/domain/workflow";
import {
  mobileWorkflowDataSource,
  type BoardHomePayload,
  type MobileWorkflowDataSource,
} from "@/services/mobile-workflow-data-source";

export function useBoardMobileFlow(
  dataSource: MobileWorkflowDataSource = mobileWorkflowDataSource,
) {
  const [home, setHome] = useState<BoardHomePayload>(boardHome);
  const [seriesReviews, setSeriesReviews] = useState(boardSeries);
  const [rankings, setRankings] = useState(boardRankings);
  const [atRiskCases, setAtRiskCases] = useState(atRiskTitles);
  const [decisionHistory, setDecisionHistory] = useState(boardDecisionHistory);
  const [selectedProposalSummary, setSelectedProposalSummary] =
    useState<SeriesProposalSummary | null>(null);
  const [proposalSummaryLoading, setProposalSummaryLoading] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState(boardSeries[0]?.id ?? "");
  const [selectedAtRiskId, setSelectedAtRiskId] = useState(atRiskTitles[0]?.id ?? "");
  const [selectedRankingId, setSelectedRankingId] = useState(boardRankings[0]?.id ?? "");
  const [pendingVote, setPendingVote] = useState<BoardVoteValue | null>(null);
  const [pendingFinalize, setPendingFinalize] = useState(false);
  const [pendingAtRiskDecision, setPendingAtRiskDecision] = useState<AtRiskDecision | null>(null);
  const [lastMockAction, setLastMockAction] = useState(
    "Board actions call live API endpoints; permissions, quorum, and audit stay server-owned.",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voteNote, setVoteNote] = useState("");
  const [finalizeNote, setFinalizeNote] = useState("");
  const [atRiskNote, setAtRiskNote] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextHome, nextSeries, nextRankings, nextAtRisk, nextHistory] =
        await Promise.all([
          dataSource.getBoardHome(),
          dataSource.getBoardSeriesReviews(),
          dataSource.getBoardRankings(),
          dataSource.getBoardAtRiskCases(),
          dataSource.getBoardDecisionHistory(),
        ]);

      setHome(nextHome);
      setSeriesReviews(nextSeries);
      setRankings(nextRankings);
      setAtRiskCases(nextAtRisk);
      setDecisionHistory(nextHistory);
    } catch {
      setError("Could not load board mobile flow.");
    } finally {
      setLoading(false);
    }
  }, [dataSource]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await reload();
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const selectedSeries = useMemo(
    () => seriesReviews.find((item) => item.id === selectedSeriesId) ?? seriesReviews[0],
    [seriesReviews, selectedSeriesId],
  );

  useEffect(() => {
    // Wait for the live board reviews to load. The initial mock reviews carry
    // placeholder ids (e.g. "neon") that 404 against /series/:id/summary.
    if (loading) return;
    const seriesId = selectedSeries?.id;
    if (!seriesId) {
      setSelectedProposalSummary(null);
      return;
    }

    let cancelled = false;
    setProposalSummaryLoading(true);
    void dataSource
      .getSeriesProposalSummary(seriesId, "board")
      .then((summary) => {
        if (!cancelled) setSelectedProposalSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setSelectedProposalSummary(null);
      })
      .finally(() => {
        if (!cancelled) setProposalSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataSource, loading, selectedSeries?.id]);

  const selectedAtRiskCase = useMemo(
    () => atRiskCases.find((item) => item.id === selectedAtRiskId) ?? atRiskCases[0],
    [atRiskCases, selectedAtRiskId],
  );

  const selectedRanking = useMemo(
    () => rankings.find((item) => item.id === selectedRankingId) ?? rankings[0],
    [rankings, selectedRankingId],
  );

  function startVote(value: BoardVoteValue) {
    setActionError(null);
    setVoteNote("");
    setPendingVote(value);
  }

  async function confirmVote() {
    const value = pendingVote;
    if (!value) return;

    const target = selectedSeries;
    if (!target) return;

    setActionBusy(true);
    setActionError(null);
    try {
      await dataSource.castBoardVote(target.id, {
        value,
        note: voteNote.trim() || undefined,
      });
      setLastMockAction(`Board ${value} vote submitted for ${target.title}.`);
      setVoteNote("");
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not complete the Board action.");
      return;
    } finally {
      setActionBusy(false);
    }
    setPendingVote(null);
  }

  function cancelVote() {
    if (actionBusy) return;
    setPendingVote(null);
    setActionError(null);
    setVoteNote("");
  }

  function startFinalizeDecision() {
    setActionError(null);
    setFinalizeNote("");
    setPendingFinalize(true);
  }

  async function confirmFinalizeDecision() {
    const target = selectedSeries;
    if (!target) return;

    setActionBusy(true);
    setActionError(null);
    try {
      if (!target.sessionId) {
        throw new Error("An active VotingSession is required before finalization.");
      }
      await dataSource.finalizeBoardDecision(target.id, {
        sessionId: target.sessionId,
        note: finalizeNote.trim() || undefined,
      });
      setLastMockAction(
        `Board finalize request submitted for ${target.title}. Backend resolved quorum, plurality, and final status.`,
      );
      setFinalizeNote("");
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not finalize the Board decision.");
      return;
    } finally {
      setActionBusy(false);
    }
    setPendingFinalize(false);
  }

  function cancelFinalizeDecision() {
    if (actionBusy) return;
    setPendingFinalize(false);
    setActionError(null);
    setFinalizeNote("");
  }

  function startAtRiskDecision(decision: AtRiskDecision) {
    setActionError(null);
    setAtRiskNote("");
    setPendingAtRiskDecision(decision);
  }

  async function confirmAtRiskDecision() {
    const decision = pendingAtRiskDecision;
    const target = selectedAtRiskCase;
    if (!decision || !target) return;

    setActionBusy(true);
    setActionError(null);
    try {
      await dataSource.createBoardAtRiskDecision(target.id, {
        decision,
        note: atRiskNote.trim() || undefined,
      });
      setLastMockAction(`At-risk ${decision} decision submitted for ${target.title}.`);
      setAtRiskNote("");
      await reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not complete the at-risk decision.",
      );
      return;
    } finally {
      setActionBusy(false);
    }
    setPendingAtRiskDecision(null);
  }

  function cancelAtRiskDecision() {
    if (actionBusy) return;
    setPendingAtRiskDecision(null);
    setActionError(null);
    setAtRiskNote("");
  }

  return {
    home,
    seriesReviews,
    rankings,
    atRiskCases,
    decisionHistory,
    selectedSeries,
    selectedProposalSummary,
    proposalSummaryLoading,
    selectedAtRiskCase,
    selectedRanking,
    selectedSeriesId,
    selectedAtRiskId,
    selectedRankingId,
    pendingVote,
    pendingFinalize,
    pendingAtRiskDecision,
    setSelectedSeriesId,
    setSelectedAtRiskId,
    setSelectedRankingId,
    lastMockAction,
    startVote,
    confirmVote,
    cancelVote,
    startFinalizeDecision,
    confirmFinalizeDecision,
    cancelFinalizeDecision,
    startAtRiskDecision,
    confirmAtRiskDecision,
    cancelAtRiskDecision,
    voteNote,
    setVoteNote,
    finalizeNote,
    setFinalizeNote,
    atRiskNote,
    setAtRiskNote,
    actionBusy,
    actionError,
    reload,
    loading,
    error,
  };
}
