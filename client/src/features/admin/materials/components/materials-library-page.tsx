import {
  ActionButton,
  MetricCard,
  MetricGrid,
  PageFrame,
  PageHeader,
  SearchToolbar,
  StateBlock,
  TextButton,
  DataPagination,
} from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Plus, AlertCircle, FileText, CheckCircle2, Box, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccessDenied, mapAdminError, useAdminAccess } from "../../_shared";
import { useAdminMaterialsQuery, useAdminStorageSummaryQuery } from "../api/materials.queries";
import { MaterialInspector } from "./material-inspector";
import { UploadMaterialDialog } from "./upload-material-dialog";
import { ReplaceMaterialDialog } from "./replace-material-dialog";
import { MaterialsTable } from "./materials-table";
import { formatStorageSize } from "../../_shared";

type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";
type ScopeFilter = "ALL" | "PROPOSAL" | "SERIES" | "CHAPTER" | "PAGE";

const ROWS_PER_PAGE = 10;

function FilterSelect<T extends string>({
  value,
  onValueChange,
  children,
}: {
  value: T;
  onValueChange: (v: T) => void;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
      <SelectTrigger className="h-[34px] w-full min-w-[130px] rounded-[6px] border-[var(--admin-border)] bg-transparent text-[13px] font-medium text-[var(--admin-ink)] focus:ring-0 md:w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function AdminMaterialsPage() {
  const { user: currentUser, canQueryAdmin, denial } = useAdminAccess();
  const {
    data: materials = [],
    isLoading,
    error,
  } = useAdminMaterialsQuery({ enabled: canQueryAdmin });
  const { data: storageSummary } = useAdminStorageSummaryQuery({ enabled: canQueryAdmin });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const activeAssets = materials.filter((m) => m.status === "ACTIVE").length;
  const inReviewAssets = materials.filter((m) => m.status === "IN_REVIEW").length;
  const approvedAssets = materials.filter((m) => m.status === "APPROVED").length;
  const archivedAssets = materials.filter((m) => m.status === "ARCHIVED").length;

  const filtersActive = query.trim().length > 0 || statusFilter !== "ALL" || scopeFilter !== "ALL";

  const filtered = useMemo(() => {
    let result = materials;
    if (statusFilter !== "ALL") result = result.filter((m) => m.status === statusFilter);
    if (scopeFilter !== "ALL") result = result.filter((m) => m.scope === scopeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.fileKey.toLowerCase().includes(q) ||
          m.kind.toLowerCase().includes(q),
      );
    }
    return result;
  }, [materials, statusFilter, scopeFilter, query]);

  const paged = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  if (denial) {
    return (
      <AccessDenied
        title="Material Library"
        description="You do not have permission to access the material library."
        denial={denial}
      />
    );
  }

  if (error) {
    return (
      <PageFrame>
        <StateBlock
          tone="danger"
          title="Could not load materials"
          description={mapAdminError(error)}
        />
      </PageFrame>
    );
  }

  const exportCsv = () => {
    const csv = [
      ["Title", "Scope", "Kind", "Status", "Version", "Size", "Uploaded By", "Last Updated"],
      ...filtered.map((m) => {
        const latestVersion = m.versions?.[0];
        return [
          m.title,
          m.scope,
          m.kind,
          m.status,
          m.currentVersion,
          latestVersion ? latestVersion.size : 0,
          latestVersion ? latestVersion.uploadedByName : "",
          m.updatedAt,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materials-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="p-0">
      <section className="min-h-[calc(100vh-4rem)] px-5 py-6 lg:px-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="Material Library"
          description="Manage uploaded manga assets, references, page files, and versioned production materials."
        >
          <TextButton onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" />
            Export List
          </TextButton>
          <ActionButton tone="primary" onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" />
            Upload File
          </ActionButton>
        </PageHeader>

        <MetricGrid columns={5} className="mt-6">
          <MetricCard
            icon={<FileText className="size-5" />}
            label="Total Materials"
            value={materials.length}
            hint="Indexed records"
          />
          <MetricCard
            icon={<CheckCircle2 className="size-5" />}
            label="Active Assets"
            value={activeAssets}
            hint="Currently in use"
            tone="success"
          />
          <MetricCard
            icon={<AlertCircle className="size-5" />}
            label="In Review"
            value={inReviewAssets}
            hint="Pending approval"
            tone="warning"
          />
          <MetricCard
            icon={<CheckCircle2 className="size-5" />}
            label="Approved"
            value={approvedAssets}
            hint="Production ready"
          />
          <MetricCard
            icon={<Box className="size-5" />}
            label="Archived"
            value={archivedAssets}
            hint="Preserved history"
            tone="default"
          />
        </MetricGrid>

        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search title, file, series, chapter..."
          className="mt-7"
          filters={
            <>
              <FilterSelect
                value={scopeFilter}
                onValueChange={(value) => setScopeFilter(value as ScopeFilter)}
              >
                <SelectItem value="ALL">All Scopes</SelectItem>
                <SelectItem value="PROPOSAL">Proposal</SelectItem>
                <SelectItem value="SERIES">Series</SelectItem>
                <SelectItem value="CHAPTER">Chapter</SelectItem>
                <SelectItem value="PAGE">Page</SelectItem>
              </FilterSelect>
              <FilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </FilterSelect>
            </>
          }
        />

        {filtersActive && filtered.length === 0 ? (
          <div className="py-12">
            <StateBlock
              tone="default"
              title="No materials found"
              description="Try adjusting your search query or filters to find what you're looking for."
            />
          </div>
        ) : materials.length === 0 && !isLoading ? (
          <div className="py-12">
            <StateBlock
              tone="default"
              title="Material library is empty"
              description="Upload a material to get started."
            />
          </div>
        ) : (
          <MaterialsTable
            data={paged}
            isLoading={isLoading}
            onRowClick={(id: string) => {
              setSelectedId(id);
              setInspectorOpen(true);
            }}
            onReplace={(id: string) => setReplaceTargetId(id)}
          />
        )}

        <DataPagination
          total={filtered.length}
          page={page}
          pageSize={ROWS_PER_PAGE}
          onPageChange={setPage}
          itemName="materials"
        />

        {inspectorOpen && selectedId && (
          <MaterialInspector
            materialId={selectedId}
            onClose={() => {
              setInspectorOpen(false);
              setTimeout(() => setSelectedId(null), 300);
            }}
            onReplace={(id: string) => {
              setInspectorOpen(false);
              setReplaceTargetId(id);
            }}
          />
        )}

        {uploadOpen && <UploadMaterialDialog open={uploadOpen} onOpenChange={setUploadOpen} />}

        {replaceTargetId && (
          <ReplaceMaterialDialog
            open={!!replaceTargetId}
            onOpenChange={(open: boolean) => !open && setReplaceTargetId(null)}
            materialId={replaceTargetId}
          />
        )}
      </section>
    </PageFrame>
  );
}
