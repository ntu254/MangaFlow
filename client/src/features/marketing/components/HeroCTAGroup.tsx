
import { Link } from "react-router-dom"

export function HeroCTAGroup() {
  return (
    <div className="flex items-center gap-md mt-sm">
      <Link
        to="/login"
        className="inline-flex items-center gap-sm bg-primary text-white font-label-md text-label-md px-xl py-md rounded-full hover:bg-primary-container transition-all shadow-md hover:shadow-lg active:scale-95 no-underline"
      >
        Start your workspace
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
      <Link
        to="/login"
        className="inline-flex items-center gap-sm text-on-surface-variant font-label-md text-label-md px-lg py-md rounded-full hover:bg-surface-container-high transition-colors no-underline"
      >
        <span className="material-symbols-outlined text-[18px]">play_circle</span>
        See how it works
      </Link>
    </div>
  )
}
