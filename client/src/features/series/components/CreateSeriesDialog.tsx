import { useState, type FormEvent } from "react"
import { createSeries } from "../api/series.api"
import type { CreateSeriesInput, Series } from "../api/series.types"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFDialog } from "@/shared/components/ui/MFDialog"
import { MFInput } from "@/shared/components/ui/MFInput"
import { MFTextarea } from "@/shared/components/ui/MFTextarea"

interface CreateSeriesDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (series: Series) => void
}

interface FormErrors {
  title?: string
  synopsis?: string
  genres?: string
}

const INITIAL_FORM = {
  title: "",
  synopsis: "",
  genres: "",
}

function validateForm(form: typeof INITIAL_FORM) {
  const errors: FormErrors = {}
  const genres = form.genres
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean)

  if (!form.title.trim()) {
    errors.title = "Title is required."
  } else if (form.title.trim().length > 120) {
    errors.title = "Title must be 120 characters or fewer."
  }

  if (!form.synopsis.trim()) {
    errors.synopsis = "Synopsis is required."
  } else if (form.synopsis.trim().length > 2000) {
    errors.synopsis = "Synopsis must be 2,000 characters or fewer."
  }

  if (genres.length > 10) {
    errors.genres = "Add no more than 10 genres."
  } else if (genres.some((genre) => genre.length > 40)) {
    errors.genres = "Each genre must be 40 characters or fewer."
  }

  return { errors, genres }
}

export function CreateSeriesDialog({
  open,
  onClose,
  onCreated,
}: CreateSeriesDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    if (isSubmitting) return
    setErrors({})
    setApiError("")
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateForm(form)
    setErrors(result.errors)
    setApiError("")

    if (Object.keys(result.errors).length > 0) return

    const input: CreateSeriesInput = {
      title: form.title.trim(),
      synopsis: form.synopsis.trim(),
      genres: result.genres,
    }

    setIsSubmitting(true)
    try {
      const response = await createSeries(input)
      if (!response.success || !response.data) {
        setApiError(response.message ?? "Could not create the Series proposal.")
        return
      }

      onCreated(response.data)
      setForm(INITIAL_FORM)
      setErrors({})
      onClose()
    } catch {
      setApiError("Could not reach MangaFlow. Check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MFDialog
      open={open}
      onClose={handleClose}
      title="Create Series proposal"
      description="Start a draft profile. Manuscript upload and editor submission come in later workflow steps."
      footer={
        <>
          <MFButton type="button" variant="ghost" disabled={isSubmitting} onClick={handleClose}>
            Cancel
          </MFButton>
          <MFButton
            type="submit"
            form="create-series-form"
            loading={isSubmitting}
            className="focus-visible:shadow-focus"
          >
            Create draft
          </MFButton>
        </>
      }
    >
      <form id="create-series-form" className="space-y-md" onSubmit={handleSubmit}>
        {apiError ? (
          <div
            className="rounded-xl bg-error-container px-md py-sm text-body-md text-on-error-container"
            role="alert"
          >
            {apiError}
          </div>
        ) : null}
        <MFInput
          label="Series title"
          required
          value={form.title}
          maxLength={120}
          error={errors.title}
          placeholder="e.g. Moon Ink"
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        />
        <MFTextarea
          label="Synopsis"
          required
          value={form.synopsis}
          maxLength={2000}
          error={errors.synopsis}
          hint={`${form.synopsis.length}/2000 characters`}
          placeholder="Describe the core premise and creative direction."
          onChange={(event) =>
            setForm((current) => ({ ...current, synopsis: event.target.value }))
          }
        />
        <MFInput
          label="Genres"
          value={form.genres}
          error={errors.genres}
          hint="Optional. Separate up to 10 genres with commas."
          placeholder="Drama, Fantasy, Mystery"
          onChange={(event) => setForm((current) => ({ ...current, genres: event.target.value }))}
        />
      </form>
    </MFDialog>
  )
}
