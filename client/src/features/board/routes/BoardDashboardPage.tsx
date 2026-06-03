import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { fetchBoardMembers, fetchBoardVoteSummary, fetchCurrentUser, type BoardMember, type VoteSummary, type CurrentUser } from "../api/board";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  Users,
  Vote,
  ChevronRight
} from "lucide-react";

export function BoardDashboardPage() {
  const { getToken } = useAuth();
  const [seriesList, setSeriesList] = useState<(Series & { voteSummary?: VoteSummary })[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // 1. Fetch current user to determine board registration
      const user = await fetchCurrentUser(token);
      if (user) {
        setCurrentUser(user);
      }

      // 2. Fetch all series and board members
      const [allSeries, members] = await Promise.all([
        fetchSeriesList(token),
        fetchBoardMembers(token)
      ]);

      setBoardMembers(members);

      // 3. Filter series in BOARD_REVIEW and fetch summaries
      const boardReviewSeries = allSeries.filter(s => s.status === "BOARD_REVIEW");
      
      const enrichedSeries = await Promise.all(
        boardReviewSeries.map(async (s) => {
          try {
            const summary = await fetchBoardVoteSummary(token, s.id);
            return { ...s, voteSummary: summary };
          } catch {
            return s;
          }
        })
      );

      setSeriesList(enrichedSeries);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load board dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loggedInMember = boardMembers.find(m => m.userId === currentUser?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-indigo-500" />
          <span>Loading Board Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30 py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                Editorial Board
              </Badge>
              {loggedInMember && (
                <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  {loggedInMember.role === "BOARD_CHAIR" ? "Board Chair" : "Board Member"}
                  {loggedInMember.status !== "ACTIVE" && " (Inactive)"}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Board Approvals
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base">
              Review finalized editorial proposals, evaluate voting metrics, and resolve publication decisions.
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            className="border-indigo-500/30 hover:bg-indigo-950/50 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reload Board
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-10">
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loggedInMember && loggedInMember.status !== "ACTIVE" && (
          <div className="bg-amber-950/40 border border-amber-500/35 p-4 rounded-xl text-amber-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-amber-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Your board status is INACTIVE</strong>
              Your vote actions and decisions finalization will be restricted until an Admin reactivates your account.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main List */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                    <Vote className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Series Under Board Review</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Pending decisions requiring voting or tie-breaking</p>
                  </div>
                </div>
                <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  {seriesList.length} Pending
                </Badge>
              </div>

              {seriesList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                  <CheckCircle className="mx-auto size-10 text-slate-600 mb-3" />
                  <p className="text-slate-300 text-sm font-semibold">Queue is Clear</p>
                  <p className="text-xs text-slate-500 mt-1">No series are waiting for board review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seriesList.map((series) => {
                    const total = series.voteSummary?.totalVotes ?? 0;
                    const approve = series.voteSummary?.approve ?? 0;
                    const reject = series.voteSummary?.reject ?? 0;
                    const needsRevision = series.voteSummary?.needsRevision ?? 0;

                    // Tie checks
                    const hasVotes = total > 0;
                    const isTied = hasVotes && (
                      (approve === reject && approve >= needsRevision) ||
                      (approve === needsRevision && approve >= reject) ||
                      (reject === needsRevision && reject >= approve)
                    );

                    return (
                      <div
                        key={series.id}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border border-slate-800 bg-slate-950/40 rounded-xl hover:border-indigo-500/30 hover:bg-slate-950/60 transition-all gap-5"
                      >
                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-slate-200">
                              {series.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 border-indigo-500/20 text-indigo-400">
                              {series.status}
                            </Badge>
                            {isTied && (
                              <Badge className="bg-red-950 text-red-400 border border-red-900/50 text-[10px]">
                                Tie-Break Required
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {series.description || "No description provided."}
                          </p>

                          {/* Vote bars */}
                          <div className="pt-2">
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                              <span>Votes cast: {total}</span>
                              <div className="flex gap-2">
                                <span className="text-emerald-400">Approve: {approve}</span>
                                <span className="text-rose-400">Reject: {reject}</span>
                                <span className="text-amber-400">Revision: {needsRevision}</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                              {hasVotes ? (
                                <>
                                  <div style={{ width: `${(approve / total) * 100}%` }} className="bg-emerald-500 h-full" />
                                  <div style={{ width: `${(reject / total) * 100}%` }} className="bg-rose-500 h-full" />
                                  <div style={{ width: `${(needsRevision / total) * 100}%` }} className="bg-amber-500 h-full" />
                                </>
                              ) : (
                                <div className="w-full bg-slate-800 h-full" />
                              )}
                            </div>
                          </div>
                        </div>

                        <Link to={`/app/board/series/${series.id}/review`} className="w-full md:w-auto">
                          <Button size="sm" className="w-full md:w-auto bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1 text-xs px-4 py-2">
                            Review & Vote <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Users className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Board Members</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Members of the decision panel</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {boardMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 border border-slate-800/60 bg-slate-950/20 rounded-lg text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-300">
                        {currentUser && member.userId === currentUser.id
                          ? "You"
                          : `Board Member (${member.userId.slice(-6)})`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Role: {member.role === "BOARD_CHAIR" ? "Chair" : "Member"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        member.status === "ACTIVE"
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-950/20"
                          : "text-slate-500 border-slate-700 bg-slate-900"
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
