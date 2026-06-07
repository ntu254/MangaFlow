import { useState } from "react"
import { RoleTabSelector, type RoleTabId } from "./RoleTabSelector"
import { RoleFeaturePanel } from "./RoleFeaturePanel"

export function RoleViewSection() {
  const [activeRole, setActiveRole] = useState<RoleTabId>("mangaka")

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="mb-4 text-center text-headline-lg text-on-surface">For Every Role</h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-body-lg text-on-surface-muted">
        Every team member has a workspace tailored to their role.
      </p>
      <div className="mb-8 flex justify-center">
        <RoleTabSelector activeRole={activeRole} onRoleChange={(id) => setActiveRole(id as RoleTabId)} />
      </div>
      <RoleFeaturePanel activeRole={activeRole} />
    </section>
  )
}
