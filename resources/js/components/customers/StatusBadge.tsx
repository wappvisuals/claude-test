import { Badge } from '@/components/ui/badge'
import type { CustomerStatus } from '@/types/customer'

interface StatusBadgeProps {
  status: CustomerStatus | string | null | undefined
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active:   { label: 'Active',   className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100' },
  blocked:  { label: 'Blocked',  className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
}

const fallback = { label: 'Unknown', className: 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100' }

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = (status && statusConfig[status]) || fallback
  return <Badge className={config.className}>{config.label}</Badge>
}
