import { useLocation } from 'react-router-dom'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { DropdownMenu, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown'

/** Derive a breadcrumb trail from the current path for the header. */
function useBreadcrumb(): string[] {
  const { pathname } = useLocation()
  if (pathname.startsWith('/customers/')) return ['Customers', 'Customer details']
  if (pathname.startsWith('/customers')) return ['Customers']
  if (pathname.startsWith('/gdpr')) return ['Customers', 'GDPR']
  if (pathname.startsWith('/blocked-ssn')) return ['Customers', 'Blocked SSNs']
  return ['Dashboard']
}

export function AppHeader() {
  const trail = useBreadcrumb()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {trail.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">/</span>}
            <span className={i === trail.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-400'}>
              {part}
            </span>
          </span>
        ))}
      </nav>

      {/* Account menu */}
      <DropdownMenu
        trigger={
          <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-xs font-semibold text-white">
              A
            </span>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">Admin</span>
            <ChevronDown size={14} className="text-gray-400" />
          </span>
        }
      >
        <DropdownLabel>Signed in as Admin</DropdownLabel>
        <DropdownSeparator />
        <DropdownItem><User size={14} /> Profile</DropdownItem>
        <DropdownItem><Settings size={14} /> Settings</DropdownItem>
        <DropdownSeparator />
        <DropdownItem className="text-red-600 hover:bg-red-50"><LogOut size={14} /> Sign out</DropdownItem>
      </DropdownMenu>
    </header>
  )
}
