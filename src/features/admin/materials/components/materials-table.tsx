import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/shared/layout/page-layout";
import { StatusPill, DataTable } from "@/shared/ui";
import { formatDateTime, formatStorageSize } from "../../_shared";
import { MoreHorizontal, Eye, Download, UploadCloud, Archive, RefreshCw } from "lucide-react";
import type { Material } from "../../_shared/api/admin-queries";
import { useArchiveMaterialMutation, useRestoreMaterialMutation } from "../api/materials.queries";
import { toast } from "sonner";

interface MaterialsTableProps {
  data: Material[];
  isLoading?: boolean;
  onRowClick: (id: string) => void;
  onReplace: (id: string) => void;
}

export function MaterialsTable({ data, isLoading, onRowClick, onReplace }: MaterialsTableProps) {
  const archiveMutation = useArchiveMaterialMutation();
  const restoreMutation = useRestoreMaterialMutation();

  return (
    <DataTable className="mt-5" isLoading={isLoading} skeletonRows={10} skeletonColumns={9}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[var(--admin-surface)]">
            <TableRow className="border-b-[var(--admin-border)] hover:bg-transparent">
              <TableHead className="h-12 pl-5 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                File / Asset
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Scope
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Kind
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Status
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Version
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Size
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Uploaded By
              </TableHead>
              <TableHead className="h-12 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Updated
              </TableHead>
              <TableHead className="h-12 pr-5 text-right font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((material) => {
              const latestVersion = material.versions?.[0];
              const size = latestVersion?.size || 0;
              const uploadedBy = latestVersion?.uploadedByName || "System";
              const date = latestVersion?.uploadedAt || "Unknown";

              return (
                <TableRow
                  key={material.id}
                  className="cursor-pointer border-b-[var(--admin-border)] transition-colors hover:bg-[var(--admin-hover)]"
                  onClick={() => onRowClick(material.id)}
                >
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] overflow-hidden">
                        {material.thumbnailUrl ? (
                          <img
                            src={material.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--admin-muted)] uppercase">
                            {material.mimeType?.split("/")[1] || "FILE"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--admin-ink)]">
                          {material.title}
                        </p>
                        <p className="truncate text-[12px] text-[var(--admin-muted)]">
                          {material.fileKey}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-[var(--admin-hover)] px-2.5 py-0.5 text-xs font-semibold text-[var(--admin-muted)] border border-[var(--admin-border)]">
                      {material.scope}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-[var(--admin-muted)]">{material.kind}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={material.status.toLowerCase()} />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[13px] text-[var(--admin-muted)]">
                      v{material.currentVersion}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-[var(--admin-muted)]">
                      {formatStorageSize(size)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-[var(--admin-muted)]">{uploadedBy}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-[var(--admin-muted)]">
                      {formatDateTime(date)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onRowClick(material.id)}>
                          <Eye className="mr-2 size-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = latestVersion?.url || material.url;
                            window.open(url, "_blank");
                          }}
                        >
                          <Download className="mr-2 size-4" /> Download Current
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplace(material.id);
                          }}
                        >
                          <UploadCloud className="mr-2 size-4" /> Replace File
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {material.status !== "ARCHIVED" ? (
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveMutation.mutate(
                                { id: material.id, reason: "Archived from table action" },
                                { onError: (err) => toast.error(err.message) },
                              );
                            }}
                          >
                            <Archive className="mr-2 size-4" /> Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-emerald-600 focus:text-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreMutation.mutate(
                                { id: material.id, reason: "Restored from table action" },
                                { onError: (err) => toast.error(err.message) },
                              );
                            }}
                          >
                            <RefreshCw className="mr-2 size-4" /> Restore
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </DataTable>
  );
}
