import { Fragment, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type AdminActionMenuItem = {
  label: string
  onSelect: () => void
  icon?: ReactNode
  disabled?: boolean
  destructive?: boolean
  separatorBefore?: boolean
}

interface AdminActionsMenuProps {
  items: AdminActionMenuItem[]
  disabled?: boolean
}

export function AdminActionsMenu({ items, disabled }: AdminActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-8 w-8 text-gray-500 hover:bg-white hover:text-gray-900 group-hover:shadow-sm"
          aria-label="Open actions"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {items.map((item) => (
          <Fragment key={item.label}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={item.destructive ? 'text-red-600 focus:text-red-600' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
