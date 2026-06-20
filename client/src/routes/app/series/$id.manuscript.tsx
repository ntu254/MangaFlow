import { createFileRoute } from "@tanstack/react-router";
import { useSidebar } from "@/layouts/SidebarContext";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import { useState, useMemo, useEffect } from "react";
import {
  useDeleteManuscript,
  useGetManuscriptDownloadUrl,
  useVerifyManuscriptFiles,
} from "@/shared/queries/useManuscripts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  Eye,
  Download,
  MoreHorizontal,
  Pencil,
  Info,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Archive,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

export const Route = createFileRoute("/app/series/$id/manuscript")({
  component: SeriesManuscript,
});

const demoManuscriptFiles = [
  {
    id: 1,
    name: "Eclipse_of_Eternity_Proposal_v1.1.pdf",
    type: "PROPOSAL_PDF",
    icon: "pdf",
    pages: 48,
    size: "24.6 MB",
    uploadedAt: "May 29, 2024 10:24 AM",
  },
  {
    id: 2,
    name: "Sample_Pages_01-20.pdf",
    type: "SAMPLE_PAGE",
    icon: "pdf",
    pages: 20,
    size: "18.2 MB",
    uploadedAt: "May 29, 2024 10:24 AM",
  },
  {
    id: 3,
    name: "Character_Concepts_v1.1.pdf",
    type: "CHARACTER_CONCEPT",
    icon: "image",
    pages: null,
    size: "6.7 MB",
    uploadedAt: "May 29, 2024 10:24 AM",
  },
];

function SeriesManuscript() {
  const { id } = Route.useParams();
  const { data: summary, isLoading } = useSeriesSummary(id);
  const { collapsed } = useSidebar();
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const deleteMutation = useDeleteManuscript();
  const downloadMutation = useGetManuscriptDownloadUrl();
  const queryClient = useQueryClient();

  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    fileId: string | null;
  }>({
    open: false,
    fileId: null,
  });

  // On mount, verify every file still exists in storage so MISSING status shows
  // up automatically. When the verification reports any change, refresh summary.
  const { data: verifyResult } = useVerifyManuscriptFiles(id);
  useEffect(() => {
    if (!verifyResult || !summary?.files) return;
    const statusById = new Map(verifyResult.map((f) => [f.id, f.status]));
    const changed = summary.files.some(
      (f: any) => statusById.has(f.id) && statusById.get(f.id) !== (f.status || "ACTIVE"),
    );
    if (changed) {
      queryClient.invalidateQueries({ queryKey: ["series", id, "summary"] });
    }
  }, [verifyResult, summary?.files, id, queryClient]);

  const handlePreviewOrDownload = (fileId: string, isPreview: boolean) => {
    downloadMutation.mutate(
      { seriesId: id, fileId },
      {
        onSuccess: (data) => {
          if (isPreview) {
            window.open(data.downloadUrl, "_blank");
          } else {
            const a = document.createElement("a");
            a.href = data.downloadUrl;
            a.download = "";
            a.click();
          }
        },
        onError: (err: any) => {
          if (err?.message?.includes("missing")) {
            // Invalidate to update the UI status to MISSING
            queryClient.invalidateQueries({ queryKey: ["series", id, "summary"] });
          }
        },
      },
    );
  };

  const handleDelete = (fileId: string) => {
    setDialogConfig({ open: true, fileId });
  };

  const mappedManuscripts = useMemo(() => {
    if (!summary?.manuscripts) return [];
    return summary.manuscripts.map((m: any, index: number) => {
      return {
        ...m,
        id: m.id,
        title: `Version ${m.version}`,
        status: m.status || "DRAFT",
        submittedAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "Unknown",
        round: summary.manuscripts.length - index,
        files: summary.files ? summary.files.length : m.fileCount || 0,
        filesList: summary.files || [],
        pages: m.pages || 0,
        size: summary.files
          ? Math.round(
              (summary.files.reduce((acc: number, f: any) => acc + (f.size || 0), 0) /
                1024 /
                1024) *
                10,
            ) /
              10 +
            " MB"
          : "Unknown",
        isActive: m.isActive || m.status === "ACTIVE" || m.status === "IN_REVIEW",
      };
    });
  }, [summary?.manuscripts, summary?.files]);

  const activeVersion = useMemo(() => {
    if (activeVersionId) {
      return mappedManuscripts.find((m: any) => m.id === activeVersionId) || mappedManuscripts[0];
    }
    return mappedManuscripts[0];
  }, [mappedManuscripts, activeVersionId]);

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-foreground/50 text-sm">Loading manuscripts...</div>;
  }

  return (
    <div
      className={`grid grid-cols-1 gap-5 pt-2 ${
        collapsed
          ? "xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]"
          : "xl:grid-cols-[minmax(0,390px)_minmax(0,1fr)]"
      }`}
    >
      {/* Left Column: Versions List */}
      <section className="flex min-h-full flex-col overflow-hidden rounded-[10px] border border-foreground/10 bg-card shadow-[0_2px_14px_rgba(5,24,38,0.05)]">
        <header className="flex items-center justify-between border-b border-foreground/7 px-4 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold leading-none tracking-tight text-foreground">
              Manuscript Versions
            </h2>
            <div className="mt-2 text-[11px] font-semibold text-foreground/50">
              Each time you revise and resubmit, a new version will be created.
            </div>
          </div>
        </header>

        <button className="mx-4 mb-3 mt-3 flex h-9 items-center justify-center gap-2 rounded-md border border-[#061A2B]/20 text-[12px] font-extrabold text-[#061A2B] shadow-sm transition-colors hover:bg-foreground/5 dark:text-blue-400">
          <Upload className="h-4 w-4" /> Upload New Version
        </button>

        <div className="flex-1 overflow-y-auto">
          {mappedManuscripts.length > 0 ? (
            mappedManuscripts.map((v: any) => (
              <div
                key={v.id}
                onClick={() => setActiveVersionId(v.id)}
                className={`mx-4 mb-3 rounded-md border p-4 transition-all cursor-pointer bg-card ${
                  activeVersion?.id === v.id
                    ? "border-[#061A2B]/30 shadow-sm ring-1 ring-[#061A2B]/10"
                    : "border-foreground/10 hover:border-foreground/20 hover:shadow-sm"
                }`}
              >
                {v.isActive && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit mb-3">
                    Current Version
                  </div>
                )}

                <div>
                  <div>
                    <div className="mb-1 flex min-w-0 items-center gap-2">
                      <h3 className="min-w-0 truncate text-[15px] font-extrabold tracking-tight text-foreground">
                        {v.title}
                      </h3>
                      <div
                        className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          v.status === "IN_REVIEW" || v.status === "EDITOR_REVIEW"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : v.status === "REVISION_REQUESTED"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-foreground/10 text-foreground/60"
                        }`}
                      >
                        {v.status.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-[11px] font-medium text-foreground/50">
                      {v.submittedAt} {v.round && `· Revision Round ${v.round}`}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button className="flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded border border-foreground/15 bg-card px-3 text-[11px] font-bold text-[#061A2B] transition-colors hover:bg-foreground/5 dark:text-blue-400">
                      {v.status === "DRAFT" ? (
                        <>
                          <Pencil className="h-3 w-3" /> Continue Editing
                        </>
                      ) : v.status === "REVISION_REQUESTED" ? (
                        <>
                          <Eye className="h-3 w-3" /> View Feedback
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Preview Version
                        </>
                      )}
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded border border-foreground/15 bg-card text-foreground/60 transition-colors hover:bg-foreground/5">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> {v.files} Files
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> {v.pages} Pages (Approx.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5" /> {v.size}
                  </span>
                </div>

                {v.isActive && v.status === "IN_REVIEW" && (
                  <div className="mt-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 flex items-start gap-2.5 text-[#061A2B] dark:text-indigo-200 text-[12px] font-medium border border-indigo-100 dark:border-indigo-500/20">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                    <div className="leading-relaxed">
                      The editor is currently reviewing this version. You can view the feedback once
                      it's available.
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[12px] font-medium text-foreground/50">
              No manuscript versions found.
            </div>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/7 px-4 py-3 text-[10px] font-semibold text-foreground/50">
          <span>
            Showing 1 to {Math.min(mappedManuscripts.length, 3)} of {mappedManuscripts.length}{" "}
            versions
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/35 shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
              disabled
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="h-7 min-w-7 rounded-md bg-[#061A2B] px-2 text-[10px] font-black text-white shadow-sm dark:bg-blue-600"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/35 shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
              disabled
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </footer>
      </section>

      {/* Right Column: Version Details */}
      <section className="min-w-0 overflow-hidden rounded-[10px] border border-foreground/10 bg-card shadow-[0_2px_14px_rgba(5,24,38,0.05)]">
        {activeVersion ? (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-foreground/5 pb-5 mb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-[20px] font-extrabold text-foreground tracking-tight">
                    {activeVersion.title}
                  </h2>
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${activeVersion.status === "IN_REVIEW" ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/10 text-foreground/60"}`}
                  >
                    {activeVersion.status.replace("_", " ")}
                  </div>
                </div>
                <div className="text-[12px] font-medium text-foreground/50">
                  Submitted {activeVersion.submittedAt}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="h-9 px-4 rounded border border-[#061A2B]/20 text-[#061A2B] dark:text-blue-400 text-[13px] font-bold hover:bg-foreground/5 transition-colors flex items-center gap-2 shadow-sm">
                  <Eye className="h-4 w-4" /> Preview All Files
                </button>
                <button className="h-9 w-9 flex items-center justify-center rounded border border-foreground/15 text-foreground/60 hover:bg-foreground/5 transition-colors shadow-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-foreground/5 pb-5 mb-5">
              <div className="flex flex-col text-center">
                <div className="text-[20px] font-extrabold text-foreground">
                  {activeVersion.files}
                </div>
                <div className="text-[11px] text-foreground/50 font-bold uppercase tracking-wider mt-1">
                  Files
                </div>
              </div>
              <div className="flex flex-col text-center sm:border-l border-foreground/5">
                <div className="text-[20px] font-extrabold text-foreground">
                  {activeVersion.pages}
                </div>
                <div className="text-[11px] text-foreground/50 font-bold uppercase tracking-wider mt-1">
                  Pages (Approx.)
                </div>
              </div>
              <div className="flex flex-col text-center border-t sm:border-t-0 sm:border-l border-foreground/5 pt-4 sm:pt-0">
                <div className="text-[20px] font-extrabold text-foreground">
                  {activeVersion.size}
                </div>
                <div className="text-[11px] text-foreground/50 font-bold uppercase tracking-wider mt-1">
                  Total Size
                </div>
              </div>
              <div className="flex flex-col text-center border-t sm:border-t-0 sm:border-l border-foreground/5 pt-4 sm:pt-0">
                <div className="text-[20px] font-extrabold text-foreground">
                  {activeVersion.round}
                </div>
                <div className="text-[11px] text-foreground/50 font-bold uppercase tracking-wider mt-1">
                  Revision Round
                </div>
              </div>
            </div>

            <h3 className="text-[13px] font-bold text-foreground mb-4">Files in this version</h3>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="text-foreground/50 font-bold uppercase tracking-wider border-b border-foreground/5 whitespace-nowrap">
                    <th className="pb-3 font-medium">File Name</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Pages</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Uploaded At</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {activeVersion.filesList && activeVersion.filesList.length > 0 ? (
                    activeVersion.filesList.map((file: any) => (
                      <tr
                        key={file.id}
                        className={`group transition-colors ${file.status === "MISSING" ? "bg-red-500/[0.02]" : "hover:bg-foreground/[0.02]"}`}
                      >
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${file.status === "MISSING" ? "bg-red-500/10 text-red-500" : file.assetType === "MANUSCRIPT" ? "bg-indigo-500/10 text-indigo-500" : "bg-blue-500/10 text-blue-500"}`}
                            >
                              {file.status === "MISSING" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : file.assetType === "MANUSCRIPT" ? (
                                <FileText className="h-4 w-4" />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`font-semibold ${file.status === "MISSING" ? "text-red-500 line-through opacity-70" : "text-foreground"}`}
                              >
                                {file.originalName}
                              </span>
                              {file.status === "MISSING" && (
                                <span className="text-[10px] text-red-500 font-medium">
                                  Missing from storage
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <div
                            className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${file.assetType === "MANUSCRIPT" ? "bg-indigo-500/10 text-indigo-600" : "bg-blue-500/10 text-blue-600"}`}
                          >
                            {file.assetType || "SUPPORTING"}
                          </div>
                        </td>
                        <td className="py-4 pr-3 text-foreground/70">—</td>
                        <td className="py-4 pr-3 text-foreground/70">
                          {Math.round(((file.size || 0) / 1024 / 1024) * 10) / 10} MB
                        </td>
                        <td className="py-4 pr-3 text-foreground/70">
                          {new Date(file.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handlePreviewOrDownload(file.id, true)}
                              disabled={file.status === "MISSING"}
                              className="flex h-7 w-7 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePreviewOrDownload(file.id, false)}
                              disabled={file.status === "MISSING"}
                              className="flex h-7 w-7 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(file.id)}
                              className="flex h-7 w-7 items-center justify-center rounded text-red-500/50 transition-colors hover:bg-red-500/10 hover:text-red-500 ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-foreground/50">
                        No files found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-foreground/20 bg-foreground/[0.02] p-6 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-foreground/[0.04] transition-colors cursor-pointer gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center border border-foreground/5 text-foreground/50 group-hover:text-[#061A2B] group-hover:border-[#061A2B]/20 transition-all">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-foreground">
                    Upload Supporting File
                  </div>
                  <div className="text-[12px] text-foreground/60 mt-0.5">
                    You can upload additional supporting files for this version.
                  </div>
                </div>
              </div>
              <button className="shrink-0 h-9 px-4 rounded border border-[#061A2B]/20 text-[#061A2B] dark:text-blue-400 text-[13px] font-bold bg-white shadow-sm transition-colors group-hover:shadow-md">
                Upload File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-foreground/50 font-medium">
            Select a version to view details
          </div>
        )}
      </section>

      <AlertDialog
        open={dialogConfig.open}
        onOpenChange={(open) =>
          setDialogConfig({ open, fileId: open ? dialogConfig.fileId : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogConfig.fileId) {
                  deleteMutation.mutate(
                    { seriesId: id, fileId: dialogConfig.fileId },
                    {
                      onSuccess: () => {
                        toast.success("File deleted successfully");
                        queryClient.setQueryData(["series", id, "summary"], (prev: any) => {
                          if (!prev?.files) return prev;
                          return {
                            ...prev,
                            files: prev.files.filter((f: any) => f.id !== dialogConfig.fileId),
                          };
                        });
                        queryClient.invalidateQueries({ queryKey: ["series", id, "summary"] });
                      },
                    },
                  );
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
