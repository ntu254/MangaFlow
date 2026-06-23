import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { useRole } from "@/shared/lib/role";
import { useState } from "react";
import { EmptyState } from "@/layouts/AppShell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { useAssignSeriesEditor } from "@/shared/queries/useSeries";
import { useUsers } from "@/shared/queries/useUsers";
import type { AdminUser } from "@/shared/api";
import { series as mockSeries } from "@/entities";
import {
  Search,
  ChevronDown,
  Grid as GridIcon,
  List as ListIcon,
  MoreHorizontal,
  ArrowUpCircle,
  Plus,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/app/series/")({
  component: SeriesList,
});

const TABS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "editor-review", label: "In Review" },
  { id: "approved", label: "Approved" },
  { id: "ongoing", label: "Ongoing" },
  { id: "at-risk", label: "At Risk" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const getTaskColor = (count: number = 0) => {
  if (count === 0) return "text-foreground/50";
  if (count <= 3) return "text-[#061A2B] dark:text-blue-400 font-medium";
  if (count <= 9) return "text-amber-500 font-medium";
  return "text-destructive font-bold";
};

const getActionColor = (action?: string) => {
  if (!action) return "text-foreground";
  const a = action.toLowerCase();
  if (a.includes("asap"))
    return "text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700";
  if (a.includes("finalize"))
    return "text-purple-600 dark:text-purple-400 font-bold hover:opacity-80";
  if (a.includes("archives")) return "text-foreground/60 font-medium hover:text-foreground/80";
  if (a.includes("wait for board")) return "text-purple-600/60 dark:text-purple-400/60";
  if (a.includes("wait for feedback")) return "text-sky-600/60 dark:text-sky-400/60";
  if (a.includes("wait")) return "text-foreground/60";
  return "text-[#061A2B] dark:text-blue-400 font-bold hover:opacity-80";
};

function SeriesList() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isAdmin = role === "admin";
  const { data: users = [] } = useUsers({ enabled: isAdmin });
  const assignEditor = useAssignSeriesEditor();
  const editors = users.filter((user) => user.role === "EDITOR" && user.isActive);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const res = await api.get("/series");
      return res.data;
    },
  });

  const rawSeriesList: any[] = apiResponse?.data || [];
  const seriesList = rawSeriesList.map((s) => {
    let mockIndex = 0;
    const id = s.id || s._id;
    if (id) {
      const charCodes = id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      mockIndex = charCodes % mockSeries.length;
    }
    const mock = mockSeries.find(ms => ms.id === id || ms.title === s.title) || mockSeries[mockIndex];
    const statusKey = String(s.status || "")
      .toLowerCase()
      .replace(/_/g, "-");
    
    return {
      ...s,
      id,
      statusKey,
      cover: s.cover || "",
      jp: s.jp || mock?.jp || "",
    };
  });

  const counts = {
    all: seriesList.length,
    draft: seriesList.filter((s) => s.statusKey === "draft").length,
    "editor-review": seriesList.filter((s) =>
      ["editor-review", "board-review", "revision-requested"].includes(s.statusKey),
    ).length,
    approved: seriesList.filter((s) => s.statusKey === "approved").length,
    ongoing: seriesList.filter((s) => s.statusKey === "ongoing").length,
    "at-risk": seriesList.filter((s) => s.statusKey === "at-risk").length,
    completed: seriesList.filter((s) => s.statusKey === "completed").length,
    cancelled: seriesList.filter((s) => s.statusKey === "cancelled").length,
  };

  const filtered = seriesList.filter((s) => {
    if (q && !`${s.title} ${s.jp || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (activeTab !== "all") {
      if (
        activeTab === "editor-review" &&
        !["editor-review", "board-review", "revision-requested"].includes(s.statusKey)
      )
        return false;
      if (activeTab !== "editor-review" && s.statusKey !== activeTab) return false;
    }
    return true;
  });

  const handleActionClick = (e: React.MouseEvent, s: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (s.nextAction?.includes("Review")) navigate({ to: `/app/series/${s.id}/reviews` });
    else if (s.nextAction?.includes("Upload"))
      navigate({ to: `/app/series/${s.id}/chapters/current/pages/upload` });
    else if (s.nextAction?.includes("archives")) navigate({ to: `/app/series/${s.id}/archives` });
    else if (s.nextAction?.includes("Finalize")) navigate({ to: `/app/series/${s.id}/proposal` });
  };

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Hero Banner */}
      <div className="relative h-[160px] w-full overflow-hidden bg-[#F7F5F0]">
        <div
          className="absolute inset-0 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="Hero background"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F5F0] to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5F0] via-[#F7F5F0]/80 to-transparent"></div>

        <div className="absolute inset-0 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-[1280px] px-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#061A2B]">My Series</h1>
              <p className="mt-1 text-[13px] text-[#061A2B]/70 font-medium">
                Manage all of your series proposals and ongoing works.
              </p>
            </div>
            {role === "mangaka" && (
              <Link
                to="/app/series/new"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#061A2B] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#061A2B]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Series Proposal
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-8 mt-2">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-foreground/10 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative flex items-center gap-2 pb-4 pt-2 text-[13px] font-semibold transition-colors whitespace-nowrap ${
                activeTab === t.id ? "text-primary" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                  activeTab === t.id
                    ? "bg-foreground/10 text-primary"
                    : "bg-foreground/5 text-foreground/40"
                }`}
              >
                {counts[t.id as keyof typeof counts]}
              </span>
              {activeTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {/* Secondary Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search series by title..."
                  className="h-10 w-[240px] rounded-md border border-foreground/10 bg-card pl-9 pr-4 text-[13px] font-medium outline-none placeholder:text-foreground/40 focus:border-primary/30 focus:ring-1 focus:ring-primary/30 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-card border border-foreground/10 rounded-md h-10 px-3 cursor-pointer hover:bg-foreground/5 shadow-sm">
                <span className="text-[13px] font-medium text-foreground/60">Status:</span>
                <span className="text-[13px] font-semibold text-primary">All</span>
                <ChevronDown className="h-4 w-4 text-foreground/40 ml-1" />
              </div>

              <div className="flex items-center gap-2 bg-card border border-foreground/10 rounded-md h-10 px-3 cursor-pointer hover:bg-foreground/5 shadow-sm">
                <span className="text-[13px] font-medium text-foreground/60">
                  Publication Type:
                </span>
                <span className="text-[13px] font-semibold text-primary">All</span>
                <ChevronDown className="h-4 w-4 text-foreground/40 ml-1" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card border border-foreground/10 rounded-md h-10 px-3 cursor-pointer hover:bg-foreground/5 shadow-sm">
                <span className="text-[13px] font-semibold text-primary">Last Updated</span>
                <ArrowUpCircle className="h-4 w-4 text-foreground/40 ml-1 rotate-180" />
              </div>

              <div className="flex items-center rounded-md border border-foreground/10 bg-card p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded shadow-sm transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-foreground/40 hover:text-foreground/70"}`}
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded shadow-sm transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-foreground/40 hover:text-foreground/70"}`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Series Container */}
          {isLoading ? (
            <div className="py-20 text-center text-sm text-foreground/50">Loading series...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No series found" hint="Try adjusting your search or filters." />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((s) => {
                const isAtRisk = s.statusKey === "at-risk";
                const progress = s.progressPercent || 0;

                return (
                  <Link
                    key={s.id || s._id}
                    to={s.statusKey === "draft" && !isAdmin ? "/app/series/new" : "/app/series/$id"}
                    search={s.statusKey === "draft" && !isAdmin ? { id: s.id || s._id } : undefined}
                    params={s.statusKey === "draft" && !isAdmin ? undefined : { id: s.id || s._id }}
                    className={`group relative flex flex-col justify-end overflow-hidden rounded-xl aspect-[3/4] transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm border ${
                      isAtRisk ? "border-red-500/50" : "border-foreground/10"
                    }`}
                  >
                    {/* Background Image */}
                    {s.cover ? (
                      <img
                        src={s.cover.startsWith("http") || s.cover.startsWith("/") || s.cover.startsWith("data:") ? s.cover : `/api/public/images/${s.cover}`}
                        alt={s.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#0B2A43] flex items-center justify-center opacity-30">
                        <BookOpen className="w-10 h-10 text-white/20" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061A2B] via-[#061A2B]/60 to-transparent opacity-90 transition-opacity group-hover:opacity-100"></div>

                    {/* Top Actions & Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <StatusBadge status={s.statusKey} variant="solid" />
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <button className="flex h-8 w-8 items-center justify-center rounded-md bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                    {isAdmin && (
                      <div className="absolute left-3 right-3 top-14 z-20">
                        <AssignEditorControl
                          seriesId={s.id || s._id}
                          editors={editors}
                          isPending={assignEditor.isPending}
                          onAssign={(editorUserId) =>
                            assignEditor.mutate({ id: s.id || s._id, editorUserId })
                          }
                          compact
                        />
                      </div>
                    )}

                    {/* Content (Overlaid) */}
                    <div className="relative z-10 flex flex-col p-5">
                      <div className="min-w-0 mb-3">
                        <div className="truncate text-[16px] font-bold text-white drop-shadow-sm">
                          {s.title}
                        </div>
                        <div className="truncate font-jp text-[12px] text-white/70 font-medium mt-0.5">
                          {s.jp || ""}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-white/80 font-medium mb-4">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{s.publicationType || "Weekly"}</span>
                          <span className="opacity-50">•</span>
                          <span>Ch. {s.currentChapter || 0}</span>
                          <span className="opacity-50">•</span>
                          <span>1h ago</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-wider">
                          <span>Progress</span>
                          <span className="text-white/90">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isAtRisk ? "bg-red-400" : s.statusKey === "completed" ? "bg-purple-400" : "bg-white"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const isWait = s.nextAction?.toLowerCase().includes("wait");
                const isAtRisk = s.statusKey === "at-risk";

                return (
                  <Link
                    key={s.id || s._id}
                    to={s.statusKey === "draft" && !isAdmin ? "/app/series/new" : "/app/series/$id"}
                    search={s.statusKey === "draft" && !isAdmin ? { id: s.id || s._id } : undefined}
                    params={s.statusKey === "draft" && !isAdmin ? undefined : { id: s.id || s._id }}
                    className={`group flex h-[160px] overflow-hidden rounded-md border transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(5,24,38,0.08)] ${
                      isAtRisk
                        ? "border-red-200 bg-card hover:border-red-300"
                        : "border-foreground/10 bg-card hover:border-foreground/20"
                    }`}
                  >
                    <div className="h-full w-[110px] flex-none bg-foreground/5 flex items-center justify-center">
                      {s.cover ? (
                        <img
                          src={s.cover.startsWith("http") || s.cover.startsWith("/") || s.cover.startsWith("data:") ? s.cover : `/api/public/images/${s.cover}`}
                          alt={s.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-6 h-6 text-foreground/20" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">
                            {s.title}
                          </div>
                          <div className="truncate font-jp text-[11px] text-foreground/55">
                            {s.jp || ""}
                          </div>
                        </div>
                        <StatusBadge status={s.statusKey} variant="solid" />
                      </div>
                      {isAdmin && (
                        <div className="mt-3">
                          <AssignEditorControl
                            seriesId={s.id || s._id}
                            editors={editors}
                            isPending={assignEditor.isPending}
                            onAssign={(editorUserId) =>
                              assignEditor.mutate({ id: s.id || s._id, editorUserId })
                            }
                          />
                        </div>
                      )}

                      <div className="mt-4 flex flex-1 flex-col justify-end gap-2 text-[11px] text-foreground/70">
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{s.publicationType || "Weekly"}</span>
                          <span className="font-medium text-foreground">
                            {s.currentChapter ? `Ch. ${s.currentChapter}` : ""}
                          </span>
                        </div>
                        <div className="text-[10px]">
                          Pages {s.pages?.uploaded || 0}/{s.pages?.total || 0} &middot; Tasks{" "}
                          <span className={getTaskColor(s.pendingTasks)}>
                            {s.pendingTasks || 0}{" "}
                            {s.statusKey === "board-review" || s.statusKey === "editor-review"
                              ? "waiting"
                              : "pending"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-foreground/5 px-2 py-1.5 mt-1">
                          <span className="text-[#8A8F98]">{isWait ? "Status" : "Action"}</span>
                          <button
                            onClick={(e) => (isWait ? e.preventDefault() : handleActionClick(e, s))}
                            className={`flex items-center gap-1 transition-opacity ${getActionColor(s.nextAction)}`}
                          >
                            {s.nextAction || "Continue"} {!isWait && "→"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignEditorControl({
  seriesId,
  editors,
  isPending,
  onAssign,
  compact = false,
}: {
  seriesId: string;
  editors: AdminUser[];
  isPending: boolean;
  onAssign: (editorUserId: string) => void;
  compact?: boolean;
}) {
  const [editorUserId, setEditorUserId] = useState("");

  return (
    <div
      className={`flex gap-1.5 ${compact ? "rounded-md bg-black/25 p-1.5 backdrop-blur-md" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <select
        value={editorUserId}
        onChange={(event) => setEditorUserId(event.target.value)}
        disabled={editors.length === 0 || isPending}
        className="h-8 min-w-0 flex-1 rounded-md border border-foreground/10 bg-background px-2 text-xs text-foreground disabled:opacity-50"
      >
        <option value="">{editors.length === 0 ? "No active editors" : "Tantou Editor"}</option>
        {editors.map((editor) => (
          <option key={editor.id} value={editor.id}>
            {editor.displayName || editor.name || editor.email}
          </option>
        ))}
      </select>
      <button
        disabled={!editorUserId || isPending}
        onClick={() => onAssign(editorUserId)}
        className="h-8 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        Assign
      </button>
    </div>
  );
}
