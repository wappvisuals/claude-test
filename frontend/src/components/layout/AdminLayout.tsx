import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

function usePageTitle(): string {
  const { pathname } = useLocation()
  if (/^\/customers\/\d+/.test(pathname)) return 'Customer Detail'
  if (pathname.startsWith('/customers')) return 'Customers'
  return 'Admin'
}

export function AdminLayout() {
  const title = usePageTitle()

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="ml-60 flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
