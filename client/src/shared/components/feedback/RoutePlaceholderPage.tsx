import { useParams } from "react-router-dom"
import { MFBadge, MFCard, MFIconCircle } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"

interface RoutePlaceholderPageProps {
  title: string
  description: string
  icon: string
  status?: string
}

export function RoutePlaceholderPage({
  title,
  description,
  icon,
  status = "Planned",
}: RoutePlaceholderPageProps) {
  const params = useParams()
  usePageTitle(title, description)

  const routeContext = Object.entries(params)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center justify-center py-xl">
      <MFCard padding="lg" className="w-full rounded-3xl">
        <div className="flex flex-col items-center text-center">
          <MFIconCircle variant="primary" size="lg">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              {icon}
            </span>
          </MFIconCircle>
          <MFBadge tone="primary" className="mt-lg">
            {status}
          </MFBadge>
          <h2 className="mt-md text-headline-md font-headline-md text-on-surface">
            {title}
          </h2>
          <p className="mt-sm max-w-xl text-body-md text-on-surface-muted">
            {description}
          </p>

          {routeContext.length > 0 && (
            <div className="mt-lg flex flex-wrap justify-center gap-sm">
              {routeContext.map(([key, value]) => (
                <MFBadge key={key} tone="neutral">
                  {key}: {value}
                </MFBadge>
              ))}
            </div>
          )}

          <div className="mt-xl w-full rounded-2xl bg-surface-low p-lg text-left">
            <h3 className="text-title-lg font-title-lg text-on-surface">
              Implementation boundary
            </h3>
            <p className="mt-sm text-body-md text-on-surface-muted">
              This route is connected to the shared MangaFlow shell. Feature
              behavior will be added only through its own HI-OS story and
              approved product contract.
            </p>
          </div>
        </div>
      </MFCard>
    </div>
  )
}
