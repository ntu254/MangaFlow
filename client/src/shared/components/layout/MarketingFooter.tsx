import { Link } from "react-router-dom"

export function MarketingFooter() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/20 w-full py-xxl px-container-padding flex flex-col md:flex-row justify-between items-center gap-lg">
      <div className="font-display text-title-lg font-bold text-primary">
        MangaFlow
      </div>
      <ul className="flex flex-wrap justify-center gap-lg">
        <li><Link to="#" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-opacity duration-300">Privacy Policy</Link></li>
        <li><Link to="#" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-opacity duration-300">Terms of Service</Link></li>
        <li><Link to="#" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-opacity duration-300">Creator Guidelines</Link></li>
        <li><Link to="#" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-opacity duration-300">Contact</Link></li>
      </ul>
      <div className="font-label-md text-label-md text-secondary">
        &copy; {new Date().getFullYear()} MangaFlow Studio. All rights reserved.
      </div>
    </footer>
  )
}
