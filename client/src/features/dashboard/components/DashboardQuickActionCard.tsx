import { useNavigate } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"

interface DashboardQuickActionCardProps {
  title: string
  description: string
  icon: string
  actionLabel: string
  to: string
}

export function DashboardQuickActionCard({
  title,
  description,
  icon,
  actionLabel,
  to,
}: DashboardQuickActionCardProps) {
  const navigate = useNavigate()

  return (
    <MFCard className="flex h-full flex-col">
      <MFIconCircle variant="primary">
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      </MFIconCircle>
      <h3 className="mt-md text-title-lg text-on-surface">{title}</h3>
      <p className="mt-sm flex-1 text-body-md text-on-surface-muted">{description}</p>
      <MFButton
        className="mt-lg self-start focus-visible:shadow-focus"
        variant="outline"
        onClick={() => navigate(to)}
      >
        {actionLabel}
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          arrow_forward
        </span>
      </MFButton>
    </MFCard>
  )
}
