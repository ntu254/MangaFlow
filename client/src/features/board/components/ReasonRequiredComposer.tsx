import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { AlertCircle } from "lucide-react"

interface ReasonRequiredComposerProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
}

export function ReasonRequiredComposer({ label = "Reason for Decision", helperText, className, value, ...props }: ReasonRequiredComposerProps) {
  const isEmpty = !value || String(value).trim() === ""
  
  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500 tracking-wider">
        <span>{label} <span className="text-red-500">*</span></span>
        {isEmpty && <span className="text-red-500 normal-case flex items-center gap-1"><AlertCircle size={12}/> Required</span>}
      </label>
      <textarea
        value={value}
        className={cn(
          "min-h-[100px] w-full resize-y rounded-xl border bg-white p-3 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all shadow-sm",
          isEmpty ? "border-red-200 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-violet-500 focus:ring-violet-50",
          className
        )}
        {...props}
      />
      {helperText && <p className="text-[12px] text-slate-500 font-medium">{helperText}</p>}
    </div>
  )
}
