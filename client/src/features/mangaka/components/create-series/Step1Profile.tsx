import { useRef, useState } from 'react'
import { UploadCloud, Plus, HelpCircle, X, CheckCircle2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreateSeriesFormData } from './types'
import { formatFileSize } from './types'

interface Step1ProfileProps {
  formData: CreateSeriesFormData
  setFormData: (updater: CreateSeriesFormData | ((prev: CreateSeriesFormData) => CreateSeriesFormData)) => void
  pendingCover?: File | null
  setPendingCover?: (file: File | null) => void
  readOnly?: boolean
}

const COVER_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
const COVER_MAX_BYTES = 5 * 1024 * 1024
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function Step1Profile({ formData, setFormData, pendingCover, setPendingCover, readOnly = false }: Step1ProfileProps) {
  const [tagInput, setTagInput] = useState('')
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const setField = <K extends keyof CreateSeriesFormData>(key: K, value: CreateSeriesFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddTag = () => {
    const next = tagInput.trim()
    if (!next) return
    if (formData.tags.includes(next)) {
      setTagInput('')
      return
    }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, next] }))
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }))
  }

  const handleCoverPick = (file: File) => {
    if (!COVER_TYPES.includes(file.type)) {
      setCoverError('Cover must be JPG, PNG, or WEBP')
      return
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverError('Cover must be 5MB or smaller')
      return
    }
    setCoverError(null)
    setPendingCover?.(file)
  }

  const clearCover = () => {
    setCoverError(null)
    setPendingCover?.(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Basic Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col w-full">
        <h2 className="text-lg font-bold text-indigo-700 mb-6 flex items-center gap-2">1. Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
            <label className="text-[13px] font-bold text-slate-900">Series Title <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your series title"
                disabled={readOnly}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                value={formData.title}
                maxLength={100}
                onChange={(e) => setField('title', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{formData.title.length}/100</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className="text-[13px] font-bold text-slate-900">Genre <span className="text-red-500">*</span></label>
            <Select value={formData.genre} onValueChange={(val) => setField('genre', val)} disabled={readOnly}>
              <SelectTrigger className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 bg-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Action">Action</SelectItem>
                <SelectItem value="Dark Fantasy">Dark Fantasy</SelectItem>
                <SelectItem value="Romance">Romance</SelectItem>
                <SelectItem value="Slice of Life">Slice of Life</SelectItem>
                <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                <SelectItem value="Mystery">Mystery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className="text-[13px] font-bold text-slate-900">Target Audience <span className="text-red-500">*</span></label>
            <Select value={formData.audience} onValueChange={(val) => setField('audience', val)} disabled={readOnly}>
              <SelectTrigger className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 bg-white">
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Shounen">Shounen (Young Male)</SelectItem>
                <SelectItem value="Seinen">Seinen (Adult Male)</SelectItem>
                <SelectItem value="Shoujo">Shoujo (Young Female)</SelectItem>
                <SelectItem value="Josei">Josei (Adult Female)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
              Proposed Publication Type <span className="text-red-500">*</span>
              <HelpCircle size={14} className="text-slate-400" />
            </label>
            <div className="flex items-center gap-6 mt-2">
              {(['Weekly', 'Monthly'] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.publicationType === opt ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                    {formData.publicationType === opt && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{opt}</span>
                  <input
                    type="radio"
                    className="hidden"
                    checked={formData.publicationType === opt}
                    disabled={readOnly}
                    onChange={() => setField('publicationType', opt)}
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Suggested cadence. The Editorial Board makes the final publication decision.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Tags</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Add tags (press Enter)"
                disabled={readOnly}
                className="w-full h-11 pl-4 pr-24 border border-slate-200 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={readOnly}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-60"
              >
                <Plus size={14} /> Add tag
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">e.g. action, fantasy, school life</p>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={readOnly}
                      className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded disabled:opacity-60"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Cover Draft <span className="text-slate-400 font-medium">(Optional)</span></label>

            <input
              ref={coverInputRef}
              type="file"
              accept={COVER_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleCoverPick(f)
                e.target.value = ''
              }}
            />

            {pendingCover ? (
              <div className="w-full border border-emerald-200 bg-emerald-50/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-slate-900 truncate">{pendingCover.name}</span>
                    <span className="text-[11px] text-slate-500">{formatFileSize(pendingCover.size)} - will upload in step 2</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={readOnly}
                    className="px-3 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={clearCover}
                    disabled={readOnly}
                    className="px-3 h-8 border border-red-200 rounded-lg text-xs font-bold text-red-600 bg-white hover:bg-red-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={readOnly}
                className="w-full h-[88px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-4 px-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                  <UploadCloud size={18} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-indigo-600">Click to upload <span className="text-slate-600 font-medium">or drag and drop</span></span>
                  <span className="text-[11px] text-slate-500">PNG, JPG, WEBP up to 5MB</span>
                </div>
              </button>
            )}
            {coverError && <p className="text-[11px] text-rose-500 mt-1">{coverError}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-900">Synopsis / Description <span className="text-red-500">*</span></label>
          <div className="relative">
            <textarea
              placeholder="Write a brief synopsis or description of your series."
              disabled={readOnly}
              maxLength={1000}
              className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
              value={formData.synopsis}
              onChange={(e) => setField('synopsis', e.target.value)}
            />
            <span className="absolute right-4 bottom-4 text-[11px] text-slate-400 bg-white px-1">{formData.synopsis.length}/1000</span>
          </div>
        </div>
      </div>

      {/* 2. Required Story Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col w-full">
        <h2 className="text-lg font-bold text-indigo-700 mb-6 flex items-center gap-2">2. Required Story Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Logline <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="A one-sentence hook that captures your series."
                disabled={readOnly}
                maxLength={150}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                value={formData.logline}
                onChange={(e) => setField('logline', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{formData.logline.length}/150</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Story Premise <span className="text-red-500">*</span></label>
            <div className="relative">
              <textarea
                placeholder="What is the main concept and premise of your story?"
                disabled={readOnly}
                maxLength={500}
                className="w-full h-24 p-4 border border-slate-200 rounded-xl text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                value={formData.premise}
                onChange={(e) => setField('premise', e.target.value)}
              />
              <span className="absolute right-4 bottom-4 text-[11px] text-slate-400 bg-white px-1">{formData.premise.length}/500</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Main Characters <span className="text-red-500">*</span></label>
            <div className="relative">
              <textarea
                placeholder="Introduce the main characters and their key traits."
                disabled={readOnly}
                maxLength={500}
                className="w-full h-24 p-4 border border-slate-200 rounded-xl text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                value={formData.characters}
                onChange={(e) => setField('characters', e.target.value)}
              />
              <span className="absolute right-4 bottom-4 text-[11px] text-slate-400 bg-white px-1">{formData.characters.length}/500</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-900">Conflict / Hook <span className="text-red-500">*</span></label>
            <div className="relative">
              <textarea
                placeholder="What challenge or conflict drives the story forward?"
                disabled={readOnly}
                maxLength={500}
                className="w-full h-24 p-4 border border-slate-200 rounded-xl text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                value={formData.conflict}
                onChange={(e) => setField('conflict', e.target.value)}
              />
              <span className="absolute right-4 bottom-4 text-[11px] text-slate-400 bg-white px-1">{formData.conflict.length}/500</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
