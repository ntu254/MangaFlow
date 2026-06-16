import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface RevisionComposerProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  optional?: boolean
}

export function RevisionComposer({ label, optional = false, className, ...props }: RevisionComposerProps) {
  return (
    <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
      {label} {optional && <span className="font-medium normal-case text-slate-400 ml-1">(optional)</span>}
      <textarea
        className={cn(
          "mt-1.5 min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-[13px] font-medium normal-case text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50 transition-all shadow-sm",
          className
        )}
        {...props}
      />
    </label>
  )
}
