import { MFCard, MFCardHeader } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFSection } from "@/shared/components/ui/MFSection"

const users = [
  { name: "Alice", role: "Mangaka", email: "alice@studio.com" },
  { name: "Bob", role: "Assistant", email: "bob@studio.com" },
  { name: "Carol", role: "Editor", email: "carol@studio.com" },
  { name: "Dave", role: "Board Member", email: "dave@studio.com" },
]

export function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg text-on-surface">Admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <MFCard padding="md">
          <MFCardHeader><span className="text-label-md text-on-surface-muted">Total Users</span></MFCardHeader>
          <p className="text-display text-primary">{users.length}</p>
        </MFCard>
        <MFCard padding="md">
          <MFCardHeader><span className="text-label-md text-on-surface-muted">Active Series</span></MFCardHeader>
          <p className="text-display text-secondary">3</p>
        </MFCard>
        <MFCard padding="md">
          <MFCardHeader><span className="text-label-md text-on-surface-muted">Pending Tasks</span></MFCardHeader>
          <p className="text-display text-tertiary">12</p>
        </MFCard>
      </div>
      <MFSection title="Users">
        <div className="space-y-3">
          {users.map((user) => (
            <MFCard key={user.name} padding="md" className="flex items-center justify-between">
              <div>
                <h3 className="text-title-lg text-on-surface">{user.name}</h3>
                <p className="text-body-md text-on-surface-muted">{user.email}</p>
              </div>
              <MFBadge tone="primary">{user.role}</MFBadge>
            </MFCard>
          ))}
        </div>
      </MFSection>
    </div>
  )
}
