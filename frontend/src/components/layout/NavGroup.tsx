import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

export interface NavChild {
  to: string
  label: string
  /** Match the path exactly (e.g. /customers) rather than by prefix. */
  exact?: boolean
}

interface NavGroupProps {
  label: string
  icon: React.ReactNode
  /** Paths under this group — used to auto-expand and highlight the parent. */
  children: NavChild[]
}

export function NavGroup({ label, icon, children }: NavGroupProps) {
  const { pathname } = useLocation()
  // The group is "active" (expanded + highlighted) whenever the current path
  // falls under any child route — by prefix, so /customers/123 still counts.
  const groupActive = children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'))
  const [open, setOpen] = useState(groupActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          groupActive ? 'text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <span className="size-4 shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={14} className={['transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-0.5 pl-7">
          {children.map((child) => {
            const isActive = child.exact
              ? pathname === child.to
              : pathname === child.to || pathname.startsWith(child.to + '/')
            return (
              <Link
                key={child.to}
                to={child.to}
                className={[
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-white/15 font-medium text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
