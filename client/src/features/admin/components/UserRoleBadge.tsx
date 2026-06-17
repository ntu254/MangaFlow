import { Badge } from '@/shared/components/ui/badge'

export function UserRoleBadge({ role }: { role: string }) {
  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'bg-slate-800 text-slate-100 hover:bg-slate-700'
      case 'BOARD': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-transparent'
      case 'EDITOR': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-transparent'
      case 'MANGAKA': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-transparent'
      case 'ASSISTANT': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-transparent'
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-transparent'
    }
  }

  return (
    <Badge variant="outline" className={`font-medium ${getRoleColor(role)}`}>
      {role.toUpperCase()}
    </Badge>
  )
}
