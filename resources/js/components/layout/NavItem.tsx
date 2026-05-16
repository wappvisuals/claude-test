import { Link, useLocation } from 'react-router-dom'

interface NavItemProps {
  to: string
  label: string
  icon: React.ReactNode
}

export function NavItem({ to, label, icon }: NavItemProps) {
  const { pathname } = useLocation()
  const isActive = pathname === to || pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={[
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white/15 text-white'
          : 'text-slate-300 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <span className="size-4 shrink-0">{icon}</span>
      {label}
    </Link>
  )
}
