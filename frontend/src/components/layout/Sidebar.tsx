import { Users } from 'lucide-react'
import { NavGroup } from './NavGroup'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          G
        </div>
        <span className="text-sm font-semibold text-white">Gracewel</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        <NavGroup
          label="Customers"
          icon={<Users size={16} />}
          children={[
            { to: '/customers', label: 'All Customers', exact: true },
            { to: '/gdpr', label: 'GDPR' },
            { to: '/blocked-ssn', label: 'Blocked SSNs' },
          ]}
        />
      </nav>
    </aside>
  )
}
