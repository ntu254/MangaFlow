interface MetricCardProps {
  label: string
  value: string
  progress?: number
  progressColor?: string
  helperText?: string
}

export function MetricCard({ label, value, progress, progressColor, helperText }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-gray-500">{label}</span>
      <span className="text-[16px] font-extrabold text-gray-900">{value}</span>
      {typeof progress === "number" && progressColor ? (
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
          <div className={`${progressColor} h-full rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
      ) : null}
      {helperText ? <span className="text-[11px] font-medium text-gray-500">{helperText}</span> : null}
    </div>
  )
}
