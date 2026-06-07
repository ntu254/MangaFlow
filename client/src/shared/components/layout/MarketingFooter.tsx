export function MarketingFooter() {
  return (
    <footer className="border-t border-outline-variant bg-surface-low">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-title-lg font-bold text-primary">MangaFlow</span>
          <p className="text-body-md text-on-surface-muted">
            &copy; {new Date().getFullYear()} MangaFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
