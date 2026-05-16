import { StatusBadge } from './StatusBadge'
import type { Customer } from '@/types/customer'

interface CustomerDetailHeaderProps {
  customer: Customer
}

export function CustomerDetailHeader({ customer }: CustomerDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{customer.full_name}</h2>
        {customer.date_added && (
          <p className="mt-1 text-sm text-muted-foreground">
            Customer since {customer.date_added}
          </p>
        )}
      </div>
      <StatusBadge status={customer.status} />
    </div>
  )
}
