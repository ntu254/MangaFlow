import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesById, type Series } from "@/features/series/api/series";
import { listManuscripts, type Manuscript } from "@/features/manuscript/api/manuscript";
import {
  fetchBoardMembers,
  fetchBoardVotesForSeries,
  fetchBoardVoteSummary,
  fetchCurrentUser,
  submitBoardVote,
  finalizeBoardDecision,
  tieBreakBoardDecision,
  type BoardMember,
  type BoardVote,
  type VoteSummary,
  type CurrentUser
} from "../api/board";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Vote,
  TrendingUp,
  FileText
} from "lucide-react";

export function BoardSeriesReviewPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { getToken } = useAuth();

  const [series, setSeries] = useState<Series | null>(null);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [votes, setVotes] = useState<BoardVote[]>([]);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedVote, setSelectedVote] = useState<"APPROVE" | "REJECT" | "NEEDS_REVISION" | "">("");
  const [reason, setReason] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Decision state
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [tieBreakDecision, setTieBreakDecision] = useState<"APPROVED" | "REJECTED" | "NEEDS_REVISION" | "">("");
  const [tieBreakReason, setTieBreakReason] = useState("");
  const [submittingTieBreak, setSubmittingTieBreak] = useState(false);
  const [tieBreakError, setTieBreakError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!seriesId) return;
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      // Fetch user profile
      const user = await fetchCurrentUser(token);
      if (user) {
        setCurrentUser(user);
      }

      // Fetch dependencies
      const [seriesData, manuscriptList, members, voteList, summary] = await Promise.all([
        fetchSeriesById(token, seriesId),
        listManuscripts(token, seriesId),
        fetchBoardMembers(token),
        fetchBoardVotesForSeries(token, seriesId),
        fetchBoardVoteSummary(token, seriesId)
      ]);

      setSeries(seriesData);
      setManuscripts(manuscriptList);
      setBoardMembers(members);
      setVotes(voteList);
      setVoteSummary(summary);

      // Prefill user vote if exists
      const loggedInMember = members.find(m => m.userId === user?.id);
      if (loggedInMember) {
        const userVote = voteList.find(v => v.boardMemberId === loggedInMember.id);
        if (userVote) {
          setSelectedVote(userVote.vote);
          setReason(userVote.reason || "");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load proposal details");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId || !selectedVote) return;
    try {
      setSubmittingVote(true);
      setVoteError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      await submitBoardVote(token, seriesId, selectedVote, reason);
      await loadData();
    } catch (err: any) {
      setVoteError(err.message || "Failed to submit vote");
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleFinalize = async () => {
    if (!seriesId) return;
    try {
      setFinalizing(true);
      setFinalizeError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      await finalizeBoardDecision(token, seriesId);
      await loadData();
    } catch (err: any) {
      setFinalizeError(err.message || "Failed to finalize decision");
    } finally {
      setFinalizing(false);
    }
  };

  const handleTieBreakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId || !tieBreakDecision || !tieBreakReason.trim()) return;
    try {
      setSubmittingTieBreak(true);
      setTieBreakError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      await tieBreakBoardDecision(token, seriesId, tieBreakDecision, tieBreakReason);
      await loadData();
    } catch (err: any) {
      setTieBreakError(err.message || "Failed to submit tie-break decision");
    } finally {
      setSubmittingTieBreak(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-indigo-500" />
          <span>Loading Review Workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="size-12 text-red-500 mb-4" />
        <p className="text-red-400 font-semibold mb-4">{error || "Series not found"}</p>
        <Link to="/app/board/dashboard">
          <Button variant="outline" className="border-indigo-500/35">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const activeManuscript = manuscripts.find(m => m.status === "BOARD_REVIEW") || manuscripts[0];
  const loggedInMember = boardMembers.find(m => m.userId === currentUser?.id);
  const isActiveBoardMember = loggedInMember && loggedInMember.status === "ACTIVE";
  const isBoardChair = loggedInMember && loggedInMember.role === "BOARD_CHAIR";
  const isFinalized = series.status !== "BOARD_REVIEW";

  // Calculate if tie break is needed
  const total = voteSummary?.totalVotes ?? 0;
  const approve = voteSummary?.approve ?? 0;
  const reject = voteSummary?.reject ?? 0;
  const needsRevision = voteSummary?.needsRevision ?? 0;
  const isTied = total > 0 && (
    (approve === reject && approve >= needsRevision) ||
    (approve === needsRevision && approve >= reject) ||
    (reject === needsRevision && reject >= approve)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top sticky action header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-25 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <Link to="/app/board/dashboard" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-indigo-500/20 text-indigo-400 bg-indigo-950/10">
              Series Status: {series.status}
            </Badge>
            <Button onClick={loadData} size="icon" variant="ghost" className="size-8 text-slate-400 hover:text-white">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Info Banner */}
        {isFinalized && (
          <div className="bg-emerald-950/40 border border-emerald-500/35 p-5 rounded-2xl text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle className="size-6 shrink-0 text-emerald-400" />
            <div>
              <strong className="font-bold text-base block mb-0.5 text-white">Board Decision Finalized</strong>
              The decision for this series has been finalized. The status of the series is now <span className="font-semibold">{series.status}</span>. Voting and tie-break adjustments are locked.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Series Card */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <div>
                <h1 className="text-2xl font-black text-white">{series.title}</h1>
                <p className="text-xs text-slate-400 mt-1">Series Owner ID: {series.ownerId}</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {series.description || "No description provided."}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {series.genre.map(g => (
                  <Badge key={g} variant="secondary" className="bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300 text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Manuscript & PDF Visuals */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Submitted Manuscript</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Proposal artwork pages and layouts</p>
                </div>
              </div>

              {activeManuscript ? (
                <div className="space-y-4 border border-slate-800 bg-slate-950/40 p-4 rounded-xl">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-200">
                        {activeManuscript.title || `Manuscript v${activeManuscript.currentVersion}`}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Uploaded by editor/mangaka on {new Date(activeManuscript.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{activeManuscript.status}</Badge>
                  </div>

                  {activeManuscript.description && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                      {activeManuscript.description}
                    </p>
                  )}

                  {/* Manuscript pages list */}
                  {activeManuscript.fileUrls && activeManuscript.fileUrls.length > 0 ? (
                    <div className="pt-4 border-t border-slate-800/80 space-y-6">
                      {activeManuscript.fileUrls.map((url, i) => (
                        <div key={i} className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-lg p-4">
                          <span className="text-[10px] text-slate-500 mb-2 font-medium">Page {i + 1}</span>
                          {url.endsWith(".pdf") ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-400 underline py-4 font-semibold"
                            >
                              Download PDF Proposal (Page {i + 1})
                            </a>
                          ) : (
                            <img
                              src={url}
                              alt={`Proposal page ${i + 1}`}
                              className="max-h-[600px] w-auto object-contain rounded-md"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">No pages attached to proposal.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No manuscripts uploaded for this series.</p>
              )}
            </section>

            {/* Votes Details */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cast Votes & Comments</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Individual member evaluations</p>
                </div>
              </div>

              <div className="space-y-4">
                {boardMembers.map((member) => {
                  const voteObj = votes.find(v => v.boardMemberId === member.id);
                  return (
                    <div
                      key={member.id}
                      className="border border-slate-850 bg-slate-950/20 p-4 rounded-xl space-y-2.5"
                    >
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <div>
                          <strong className="text-xs text-slate-200">
                            {currentUser && member.userId === currentUser.id
                              ? "You"
                              : `Board Member (${member.userId.slice(-6)})`}
                          </strong>
                          <span className="text-[10px] text-slate-500 ml-2">
                            ({member.role === "BOARD_CHAIR" ? "Chair" : "Member"})
                          </span>
                        </div>
                        {voteObj ? (
                          <Badge
                            className={
                              voteObj.vote === "APPROVE"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50"
                                : voteObj.vote === "REJECT"
                                ? "bg-rose-950 text-rose-400 border border-rose-900/50"
                                : "bg-amber-950 text-amber-400 border border-amber-900/50"
                            }
                          >
                            {voteObj.vote}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-800">
                            No Vote
                          </Badge>
                        )}
                      </div>

                      {voteObj && voteObj.reason && (
                        <p className="text-xs text-slate-400 italic leading-relaxed border-l-2 border-slate-850 pl-3">
                          "{voteObj.reason}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Right Column (Controls) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Aggregate Progress */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <TrendingUp className="size-5" />
                </div>
                <h3 className="font-bold text-white">Vote Summary</h3>
              </div>

              {voteSummary ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center text-slate-450 font-medium">
                    <span>Total Votes Cast:</span>
                    <strong className="text-slate-200">{total}</strong>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-emerald-450 font-semibold">Approve</span>
                      <span className="text-slate-400">{approve} ({total > 0 ? Math.round((approve / total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${total > 0 ? (approve / total) * 100 : 0}%` }} className="bg-emerald-500 h-full transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-rose-450 font-semibold">Reject</span>
                      <span className="text-slate-400">{reject} ({total > 0 ? Math.round((reject / total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${total > 0 ? (reject / total) * 100 : 0}%` }} className="bg-rose-500 h-full transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-450 font-semibold">Needs Revision</span>
                      <span className="text-slate-400">{needsRevision} ({total > 0 ? Math.round((needsRevision / total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${total > 0 ? (needsRevision / total) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all" />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Loading summary...</p>
              )}
            </section>

            {/* Voting Panel */}
            {!isFinalized && isActiveBoardMember && (
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="font-bold text-white text-base">Cast Your Vote</h3>
                <form onSubmit={handleVoteSubmit} className="space-y-4">
                  {voteError && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                      {voteError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-450 block font-semibold">Your Recommendation</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        onClick={() => setSelectedVote("APPROVE")}
                        variant={selectedVote === "APPROVE" ? "default" : "outline"}
                        className={
                          selectedVote === "APPROVE"
                            ? "bg-emerald-650 hover:bg-emerald-750 text-white border-transparent text-xs"
                            : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSelectedVote("REJECT")}
                        variant={selectedVote === "REJECT" ? "default" : "outline"}
                        className={
                          selectedVote === "REJECT"
                            ? "bg-rose-650 hover:bg-rose-750 text-white border-transparent text-xs"
                            : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSelectedVote("NEEDS_REVISION")}
                        variant={selectedVote === "NEEDS_REVISION" ? "default" : "outline"}
                        className={
                          selectedVote === "NEEDS_REVISION"
                            ? "bg-amber-650 hover:bg-amber-750 text-white border-transparent text-xs"
                            : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                        }
                      >
                        Revision
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 block font-semibold">Reasoning Comment</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain your recommendation..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-250 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingVote || !selectedVote}
                    className="w-full bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-semibold"
                  >
                    {submittingVote ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                    Submit Vote
                  </Button>
                </form>
              </section>
            )}

            {/* Finalize / Tie Break Decision Panel */}
            {!isFinalized && (isBoardChair || currentUser?.systemRole === "ADMIN") && (
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="font-bold text-white text-base">Resolution Control</h3>
                
                {isTied ? (
                  <div className="space-y-4">
                    <div className="bg-red-950/40 border border-red-500/35 p-3.5 rounded-xl text-red-300 text-xs flex items-start gap-2">
                      <AlertCircle className="size-5 shrink-0 text-red-400" />
                      <div>
                        <span className="font-semibold block mb-0.5">Tie-break required!</span>
                        Votes are currently tied. As the Board Chair, you must cast the tie-breaking decision.
                      </div>
                    </div>

                    <form onSubmit={handleTieBreakSubmit} className="space-y-4">
                      {tieBreakError && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                          {tieBreakError}
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-450 block font-semibold">Final Decision Decision</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            onClick={() => setTieBreakDecision("APPROVED")}
                            variant={tieBreakDecision === "APPROVED" ? "default" : "outline"}
                            className={
                              tieBreakDecision === "APPROVED"
                                ? "bg-emerald-650 hover:bg-emerald-750 text-white border-transparent text-xs"
                                : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setTieBreakDecision("REJECTED")}
                            variant={tieBreakDecision === "REJECTED" ? "default" : "outline"}
                            className={
                              tieBreakDecision === "REJECTED"
                                ? "bg-rose-650 hover:bg-rose-750 text-white border-transparent text-xs"
                                : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setTieBreakDecision("NEEDS_REVISION")}
                            variant={tieBreakDecision === "NEEDS_REVISION" ? "default" : "outline"}
                            className={
                              tieBreakDecision === "NEEDS_REVISION"
                                ? "bg-amber-650 hover:bg-amber-750 text-white border-transparent text-xs"
                                : "border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                            }
                          >
                            Revision
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-450 block font-semibold">Tie-break Justification (Required)</label>
                        <textarea
                          value={tieBreakReason}
                          onChange={(e) => setTieBreakReason(e.target.value)}
                          placeholder="Provide the rationale for breaking the tie..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-250 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submittingTieBreak || !tieBreakDecision || !tieBreakReason.trim()}
                        className="w-full bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-semibold"
                      >
                        {submittingTieBreak ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                        Submit Tie-Break Decision
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {finalizeError && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                        {finalizeError}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluate the voting metrics and finalize the decision based on majority rule.
                    </p>
                    <Button
                      onClick={handleFinalize}
                      disabled={finalizing || total === 0}
                      className="w-full bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-semibold"
                    >
                      {finalizing ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                      Finalize Proposal Decision
                    </Button>
                  </div>
                )}
              </section>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
