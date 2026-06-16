import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { UploadCloud, FileText, X, Plus, Users, Image as ImageIcon, Briefcase, Globe, Loader2 } from 'lucide-react'
import { useUploadSeriesFile, resolveUploadContentType } from '@/features/series/hooks/useCreateSeries'
import type { UploadedSeriesFile, UploadSlot } from './types'
import { formatFileSize, UPLOAD_SLOT_LABELS } from './types'

interface Step2UploadProps {
  seriesId: string | null
  uploadedFiles: UploadedSeriesFile[]
  setUploadedFiles: (
    next: UploadedSeriesFile[] | ((prev: UploadedSeriesFile[]) => UploadedSeriesFile[]),
  ) => void
  pendingCover?: File | null
  clearPendingCover?: () => void
}

const ACCEPT_BY_SLOT: Record<UploadSlot, string> = {
  PROPOSAL_PDF: '.pdf,application/pdf',
  SAMPLE_PAGE: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  CHARACTER_CONCEPT: '.zip,.pdf,.psd,.jpg,.jpeg,.png,.webp,application/zip,application/pdf,image/vnd.adobe.photoshop,application/x-photoshop,image/jpeg,image/png,image/webp',
  COVER_DRAFT: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  REFERENCE_IMAGE: '.zip,.jpg,.jpeg,.png,.webp,application/zip,image/jpeg,image/png,image/webp',
  WORLD_SETTING: '.zip,.pdf,.psd,application/zip,application/pdf,image/vnd.adobe.photoshop,application/x-photoshop',
}

const MAX_SIZE_BYTES = 100 * 1024 * 1024 // 100MB to match backend validation

export function Step2Upload({
  seriesId,
  uploadedFiles,
  setUploadedFiles,
  pendingCover,
  clearPendingCover,
}: Step2UploadProps) {
  const upload = useUploadSeriesFile()

  const proposal = uploadedFiles.find((f) => f.slot === 'PROPOSAL_PDF') ?? null
  const samples = uploadedFiles.filter((f) => f.slot === 'SAMPLE_PAGE')
  const hasCoverUploaded = uploadedFiles.some((f) => f.slot === 'COVER_DRAFT')

  const uploadFile = async (slot: UploadSlot, file: File) => {
    if (!seriesId) {
      toast.error('Draft series is missing. Please go back to step 1.')
      return
    }
    if (!resolveUploadContentType(file)) {
      toast.error('Unsupported file type for this slot')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File exceeds 100MB limit')
      return
    }

    try {
      const result = await upload.mutateAsync({
        seriesId,
        file,
        slot,
        assetType: slot === 'PROPOSAL_PDF' || slot === 'SAMPLE_PAGE' ? 'MANUSCRIPT' : 'SUPPORTING',
      })
      setUploadedFiles((prev) => [...prev, { ...result, slot }])
      toast.success(`${UPLOAD_SLOT_LABELS[slot]}: ${file.name} uploaded`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error(message)
    }
  }

  const replaceSingle = async (slot: UploadSlot, file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.slot !== slot))
    await uploadFile(slot, file)
  }

  const removeByAssetId = (fileAssetId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.fileAssetId !== fileAssetId))
  }

  // Auto-upload the cover the user picked back in Step 1, once we have a
  // seriesId and we haven't already pushed one. Clear the pending state so we
  // don't loop.
  useEffect(() => {
    if (!seriesId || !pendingCover || hasCoverUploaded) return
    let cancelled = false
    void (async () => {
      try {
        const result = await upload.mutateAsync({ seriesId, file: pendingCover, assetType: 'SUPPORTING', slot: 'COVER_DRAFT' })
        if (cancelled) return
        setUploadedFiles((prev) => [...prev, { ...result, slot: 'COVER_DRAFT' }])
        toast.success('Cover Draft uploaded')
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Cover upload failed'
        toast.error(message)
      } finally {
        if (!cancelled) clearPendingCover?.()
      }
    })()
    return () => {
      cancelled = true
    }
    // upload is a stable mutation object from react-query; intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, pendingCover, hasCoverUploaded])

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Proposal Materials */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col w-full relative overflow-hidden">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            1. Proposal Materials <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">(Required)</span>
          </h2>
          <p className="text-[13px] text-slate-500">Upload at least one: Proposal Manuscript (PDF) or Sample Pages.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SingleFileSlot
            slot="PROPOSAL_PDF"
            title="Proposal Manuscript (PDF)"
            description="Recommended for full review"
            accept={ACCEPT_BY_SLOT.PROPOSAL_PDF}
            file={proposal}
            isUploading={upload.isPending}
            onPick={(file) => (proposal ? replaceSingle('PROPOSAL_PDF', file) : uploadFile('PROPOSAL_PDF', file))}
            onRemove={() => proposal && removeByAssetId(proposal.fileAssetId)}
          />

          <MultiFileSlot
            slot="SAMPLE_PAGE"
            title="Sample Pages"
            description="Upload one or more sample pages"
            accept={ACCEPT_BY_SLOT.SAMPLE_PAGE}
            files={samples}
            isUploading={upload.isPending}
            onPick={async (files) => { for (const f of Array.from(files)) { await uploadFile('SAMPLE_PAGE', f) } }}
            onRemove={(id) => removeByAssetId(id)}
          />
        </div>
      </div>

      {/* 2. Supporting Materials */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col w-full">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            2. Supporting Materials <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">(Optional)</span>
          </h2>
          <p className="text-[13px] text-slate-500">These materials help editors and the board understand your series better.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SupportingMaterialSlot
            slot="CHARACTER_CONCEPT"
            icon={<Users className="text-emerald-600" size={20} />}
            iconBg="bg-emerald-50"
            title="Character Concepts"
            desc="Share characters, expressions, and key details."
            accept={ACCEPT_BY_SLOT.CHARACTER_CONCEPT}
            uploadedFiles={uploadedFiles}
            isUploading={upload.isPending}
            onPick={(slot, file) => uploadFile(slot, file)}
            onRemove={(id) => removeByAssetId(id)}
          />
          <SupportingMaterialSlot
            slot="COVER_DRAFT"
            icon={<ImageIcon className="text-orange-600" size={20} />}
            iconBg="bg-orange-50"
            title="Cover Draft"
            desc="Upload your cover concept or key visual."
            accept={ACCEPT_BY_SLOT.COVER_DRAFT}
            uploadedFiles={uploadedFiles}
            isUploading={upload.isPending}
            onPick={(slot, file) => uploadFile(slot, file)}
            onRemove={(id) => removeByAssetId(id)}
          />
          <SupportingMaterialSlot
            slot="REFERENCE_IMAGE"
            icon={<Briefcase className="text-indigo-600" size={20} />}
            iconBg="bg-indigo-50"
            title="Reference Images"
            desc="Reference photos, mood boards, or scenes."
            accept={ACCEPT_BY_SLOT.REFERENCE_IMAGE}
            uploadedFiles={uploadedFiles}
            isUploading={upload.isPending}
            onPick={(slot, file) => uploadFile(slot, file)}
            onRemove={(id) => removeByAssetId(id)}
          />
          <SupportingMaterialSlot
            slot="WORLD_SETTING"
            icon={<Globe className="text-blue-600" size={20} />}
            iconBg="bg-blue-50"
            title="World / Setting"
            desc="Worldbuilding, locations, cultures, lore."
            accept={ACCEPT_BY_SLOT.WORLD_SETTING}
            uploadedFiles={uploadedFiles}
            isUploading={upload.isPending}
            onPick={(slot, file) => uploadFile(slot, file)}
            onRemove={(id) => removeByAssetId(id)}
          />
        </div>
      </div>
    </div>
  )
}

interface SingleFileSlotProps {
  slot: UploadSlot
  title: string
  description: string
  accept: string
  file: UploadedSeriesFile | null
  isUploading: boolean
  onPick: (file: File) => void | Promise<void>
  onRemove: () => void
}

function SingleFileSlot({ title, description, accept, file, isUploading, onPick, onRemove }: SingleFileSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-indigo-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-900">{title}</span>
          <span className="text-[11px] text-slate-500">{description}</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onPick(f)
          e.target.value = ''
        }}
      />

      {file ? (
        <div className="w-full border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={20} className="text-indigo-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-slate-900 truncate">{file.originalName}</span>
              <span className="text-[11px] text-slate-500">{formatFileSize(file.size)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="px-3 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Replace
            </button>
            <button
              onClick={onRemove}
              disabled={isUploading}
              className="px-3 h-8 border border-red-200 rounded-lg text-xs font-bold text-red-600 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-[220px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm text-indigo-600">
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={24} />}
          </div>
          <span className="text-[13px] font-bold text-slate-900">Click to upload</span>
          <span className="text-[11px] text-slate-400">PDF up to 100MB</span>
        </button>
      )}
    </div>
  )
}

interface MultiFileSlotProps {
  slot: UploadSlot
  title: string
  description: string
  accept: string
  files: UploadedSeriesFile[]
  isUploading: boolean
  onPick: (files: FileList) => void | Promise<void>
  onRemove: (fileAssetId: string) => void
}

function MultiFileSlot({ title, description, accept, files, isUploading, onPick, onRemove }: MultiFileSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center shrink-0">
            <ImageIcon size={16} className="text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-900">{title}</span>
            <span className="text-[11px] text-slate-500">{description}</span>
          </div>
        </div>
        {files.length > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{files.length} uploaded</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void onPick(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="w-full border border-slate-200 rounded-xl p-4 flex flex-col bg-slate-50/50 min-h-[220px]">
        {files.length > 0 ? (
          <ul className="flex flex-col gap-2 mb-3">
            {files.map((file, i) => (
              <li key={file.fileAssetId} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 flex items-center justify-center">{i + 1}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-semibold text-slate-800 truncate">{file.originalName}</span>
                    <span className="text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(file.fileAssetId)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-slate-500 mb-3">No sample pages uploaded yet.</p>
        )}

        <div className="flex flex-col items-center gap-2 w-full mt-auto">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-10 bg-white border border-dashed border-indigo-300 text-indigo-600 rounded-lg flex items-center justify-center gap-2 font-bold text-[13px] hover:bg-indigo-50 disabled:opacity-60"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add pages
          </button>
          <span className="text-[11px] text-slate-400">JPG, PNG, WEBP up to 100MB each</span>
        </div>
      </div>
    </div>
  )
}

interface SupportingMaterialSlotProps {
  slot: UploadSlot
  icon: React.ReactNode
  iconBg: string
  title: string
  desc: string
  accept: string
  uploadedFiles: UploadedSeriesFile[]
  isUploading: boolean
  onPick: (slot: UploadSlot, file: File) => void | Promise<void>
  onRemove: (fileAssetId: string) => void
}

function SupportingMaterialSlot({
  slot,
  icon,
  iconBg,
  title,
  desc,
  accept,
  uploadedFiles,
  isUploading,
  onPick,
  onRemove,
}: SupportingMaterialSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const myFiles = uploadedFiles.filter((f) => f.slot === slot)

  return (
    <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center hover:border-indigo-300 hover:shadow-sm transition-all bg-white">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${iconBg}`}>
        {icon}
      </div>
      <h3 className="text-[13px] font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-relaxed min-h-[34px] mb-3">{desc}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onPick(slot, f)
          e.target.value = ''
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full h-8 border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors disabled:opacity-60"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      <span className="text-[10px] text-slate-400 mt-2">{myFiles.length} file{myFiles.length === 1 ? '' : 's'}</span>

      {myFiles.length > 0 && (
        <ul className="w-full flex flex-col gap-1 mt-3">
          {myFiles.map((file) => (
            <li key={file.fileAssetId} className="flex items-center justify-between text-[11px] bg-slate-50 rounded px-2 py-1">
              <span className="truncate font-semibold text-slate-700">{file.originalName}</span>
              <button onClick={() => onRemove(file.fileAssetId)} className="text-slate-400 hover:text-red-600 ml-1">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
