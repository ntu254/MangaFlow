import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreateSeriesLayout } from '@/features/series/components/create-series/CreateSeriesLayout'
import { Step1Profile } from '@/features/series/components/create-series/Step1Profile'
import { Step2Upload } from '@/features/series/components/create-series/Step2Upload'
import { Step3Submit } from '@/features/series/components/create-series/Step3Submit'
import { SubmitSuccessModal } from '@/features/series/components/create-series/SubmitSuccessModal'
import {
  initialFormData,
  type CreateSeriesFormData,
  type UploadedSeriesFile,
} from '@/features/series/components/create-series/types'
import {
  useCreateSeries,
  useSubmitSeries,
  useUpdateSeries,
} from '@/features/series/hooks/useCreateSeries'
import type { CreateSeriesInput, PublicationType, UpdateSeriesInput } from '@/features/series/services/series.api'
import { useAuthStore } from '@/features/auth/store/authStore'

function mapFormToCreatePayload(form: CreateSeriesFormData): CreateSeriesInput {
  return {
    title: form.title.trim(),
    synopsis: form.synopsis.trim(),
    logline: form.logline.trim() || undefined,
    premise: form.premise.trim() || undefined,
    characters: form.characters.trim() || undefined,
    conflict: form.conflict.trim() || undefined,
    targetAudience: form.audience.trim() || undefined,
    requestedPublicationType: (form.publicationType.trim() || undefined) as PublicationType | undefined,
    tags: form.tags,
    genres: form.genre ? [form.genre] : [],
  }
}

// For Save as Draft we want partial updates: send only fields that have content
// so a backend validator that requires non-empty title/synopsis (when present)
// is happy.
function mapFormToUpdatePayload(form: CreateSeriesFormData): UpdateSeriesInput {
  const payload: UpdateSeriesInput = {}
  if (form.title.trim()) payload.title = form.title.trim()
  if (form.synopsis.trim()) payload.synopsis = form.synopsis.trim()
  if (form.logline.trim()) payload.logline = form.logline.trim()
  if (form.premise.trim()) payload.premise = form.premise.trim()
  if (form.characters.trim()) payload.characters = form.characters.trim()
  if (form.conflict.trim()) payload.conflict = form.conflict.trim()
  if (form.audience.trim()) payload.targetAudience = form.audience.trim()
  if (form.publicationType.trim()) payload.requestedPublicationType = form.publicationType.trim() as PublicationType
  payload.tags = form.tags
  payload.genres = form.genre ? [form.genre] : []
  return payload
}

function validateStep1(form: CreateSeriesFormData): string | null {
  if (!form.title.trim()) return 'Series title is required'
  if (!form.genre.trim()) return 'Please select a genre'
  if (!form.audience.trim()) return 'Please select a target audience'
  if (!form.synopsis.trim()) return 'Synopsis is required'
  if (!form.logline.trim()) return 'Logline is required'
  if (!form.premise.trim()) return 'Story premise is required'
  if (!form.characters.trim()) return 'Main characters are required'
  if (!form.conflict.trim()) return 'Conflict / hook is required'
  return null
}

export default function MangakaCreateSeriesPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<CreateSeriesFormData>(initialFormData)
  const [seriesId, setSeriesId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedSeriesFile[]>([])
  const [editorMessage, setEditorMessage] = useState('')
  // Cover Draft chosen in Step 1; uploaded once we have a seriesId in Step 2.
  const [pendingCover, setPendingCover] = useState<File | null>(null)

  const user = useAuthStore((s) => s.user)
  const createSeries = useCreateSeries()
  const updateSeries = useUpdateSeries()
  const submitSeries = useSubmitSeries()

  const hasRequiredUpload = useMemo(
    () => uploadedFiles.some((f) => f.slot === 'PROPOSAL_PDF' || f.slot === 'SAMPLE_PAGE'),
    [uploadedFiles],
  )

  const isBusy =
    createSeries.isPending || submitSeries.isPending || updateSeries.isPending

  // Step 1 -> 2: persist the draft (create once, reuse afterwards)
  const goToUploadStep = async () => {
    const error = validateStep1(formData)
    if (error) {
      toast.error(error)
      return
    }

    try {
      if (!seriesId) {
        const draft = await createSeries.mutateAsync(mapFormToCreatePayload(formData))
        setSeriesId(draft.id)
        toast.success('Draft saved')
      } else {
        // Persist any edits made on Step 1 before moving on.
        await updateSeries.mutateAsync({
          seriesId,
          input: mapFormToUpdatePayload(formData),
        })
      }
      setCurrentStep(2)
    } catch {
      // error toast handled in the hook
    }
  }

  // Step 2 -> 3: require at least one proposal/sample upload
  const goToSubmitStep = () => {
    if (!hasRequiredUpload) {
      toast.error('Upload at least one proposal PDF or sample page before continuing')
      return
    }
    setCurrentStep(3)
  }

  // Step 3: final submit
  const submit = async () => {
    if (!seriesId) {
      toast.error('Series draft is missing, please restart the flow')
      return
    }
    if (!hasRequiredUpload) {
      toast.error('At least one proposal material is required')
      return
    }
    try {
      await submitSeries.mutateAsync(seriesId)
      setIsSubmitted(true)
    } catch {
      // error toast handled in the hook
    }
  }

  // Save as Draft: create the series if missing, otherwise PATCH the latest
  // form values. Available in Step 1 and Step 2 only.
  const saveAsDraft = async () => {
    if (currentStep === 3) return

    // Save is more permissive than Next: only require the hard backend
    // constraints (title + synopsis); other fields can be filled in later.
    if (!formData.title.trim() || !formData.synopsis.trim()) {
      toast.error('Title and synopsis are required to save a draft')
      return
    }

    try {
      if (!seriesId) {
        const draft = await createSeries.mutateAsync(mapFormToCreatePayload(formData))
        setSeriesId(draft.id)
        toast.success('Draft saved')
      } else {
        await updateSeries.mutateAsync({
          seriesId,
          input: mapFormToUpdatePayload(formData),
        })
        toast.success('Draft saved')
      }
    } catch {
      // error toast handled in the hook
    }
  }

  const handleNext = () => {
    if (currentStep === 1) void goToUploadStep()
    else if (currentStep === 2) goToSubmitStep()
    else if (currentStep === 3) void submit()
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Save as Draft is only meaningful while the series is editable (steps 1 & 2)
  // and when we have at least the minimum payload to persist.
  const saveDraftDisabled =
    currentStep === 3 || !formData.title.trim() || !formData.synopsis.trim()

  return (
    <>
      <CreateSeriesLayout
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        nextDisabled={isBusy}
        nextLoading={isBusy}
        onSaveDraft={saveAsDraft}
        saveDraftLoading={createSeries.isPending || updateSeries.isPending}
        saveDraftDisabled={saveDraftDisabled}
        formData={formData}
        uploadedFiles={uploadedFiles}
      >
        {currentStep === 1 && (
          <Step1Profile
            formData={formData}
            setFormData={setFormData}
            pendingCover={pendingCover}
            setPendingCover={setPendingCover}
          />
        )}
        {currentStep === 2 && (
          <Step2Upload
            seriesId={seriesId}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            pendingCover={pendingCover}
            clearPendingCover={() => setPendingCover(null)}
          />
        )}
        {currentStep === 3 && (
          <Step3Submit
            formData={formData}
            uploadedFiles={uploadedFiles}
            editorMessage={editorMessage}
            setEditorMessage={setEditorMessage}
          />
        )}
      </CreateSeriesLayout>

      <SubmitSuccessModal
        open={isSubmitted}
        onOpenChange={setIsSubmitted}
        seriesId={seriesId}
        title={formData.title}
        authorName={user?.name}
      />
    </>
  )
}
