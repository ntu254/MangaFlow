import { useState } from "react"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import {
  ChapterCreationGateCard,
  ManuscriptUploadPanel,
  SeriesSummaryCard,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import type { Series } from "../api/series.types"
import { CreateSeriesDialog } from "../components/CreateSeriesDialog"

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

export function SeriesPage() {
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createdSeries, setCreatedSeries] = useState<Series | null>(null)
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const canCreate = user?.role === "MANGAKA"
  const canCreateChapter = createdSeries
    ? CHAPTER_READY_STATUSES.has(createdSeries.status)
    : false

  usePageTitle("Series", "Create and manage internal manga production proposals.")

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              auto_stories
            </span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-md text-on-surface">Series proposals</h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">
              Create the internal Series profile that begins MangaFlow's editorial workflow.
            </p>
          </div>
          {canCreate ? (
            <MFButton
              className="self-start focus-visible:shadow-focus sm:self-center"
              onClick={() => setIsCreateOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              Create Series
            </MFButton>
          ) : null}
        </div>
      </MFCard>

      {createdSeries ? (
        <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <div className="space-y-lg">
            <SeriesSummaryCard
              title={createdSeries.title}
              status={createdSeries.status}
              genre={createdSeries.genres.length > 0 ? createdSeries.genres.join(", ") : "Unclassified"}
              publicationType="Not supplied yet"
              description={createdSeries.synopsis}
              ownerLabel="Current Mangaka"
              metadata={[
                "Created this session",
                "Persisted list awaits query endpoint",
                `Slug: ${createdSeries.slug}`,
              ]}
            />

            <ChapterCreationGateCard
              seriesTitle={createdSeries.title}
              canCreateChapter={canCreateChapter}
              reason="Chapter creation stays disabled until the backend reports an approved, ongoing, or at-risk Series status."
            />
          </div>

          <div className="space-y-lg">
            <ManuscriptUploadPanel
              constraints={[
                "Upload/storage API is not connected in this screen yet.",
                "Submit still requires the backend manuscript workflow.",
                "Original files must be stored unchanged with private access.",
              ]}
              accept=".pdf,.zip,.jpg,.jpeg,.png"
              multiple
              onFilesSelected={(files) =>
                setSelectedManuscripts(Array.from(files, (file) => file.name))
              }
            />
            {selectedManuscripts.length > 0 ? (
              <MFCard>
                <h3 className="text-title-lg text-on-surface">Selected locally</h3>
                <ul className="mt-md list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
                  {selectedManuscripts.map((fileName) => (
                    <li key={fileName} className="break-words">
                      {fileName}
                    </li>
                  ))}
                </ul>
                <p className="mt-md text-label-sm text-on-surface-muted">
                  These filenames are local preview only; no upload request has been sent.
                </p>
              </MFCard>
            ) : null}
          </div>
        </div>
      ) : (
        <MFEmptyState
          icon="library_add"
          title={canCreate ? "No Series created in this session" : "Series list is not connected yet"}
          description={
            canCreate
              ? "Create a draft proposal to begin. Existing Series will appear when the query endpoint is available."
              : "This workspace will display permitted Series when the query endpoint is available."
          }
          action={
            canCreate ? (
              <MFButton variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create draft
              </MFButton>
            ) : undefined
          }
        />
      )}

      <CreateSeriesDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={setCreatedSeries}
      />
    </PageShell>
  )
}
