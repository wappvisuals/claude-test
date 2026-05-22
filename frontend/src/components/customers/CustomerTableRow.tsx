import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { HighlightText } from './HighlightText'
import type { Customer } from '@/types/customer'

interface CustomerTableRowProps {
  customer: Customer
  searchTokens: string[]
}

function formatAddress(c: Customer): string | null {
  const parts = [c.adress, c.post_nr, c.ort].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function CustomerTableRow({ customer, searchTokens }: CustomerTableRowProps) {
  const navigate = useNavigate()

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/customers/${customer.id}`)}
    >
      <span className="w-12 flex-shrink-0 text-sm text-gray-400 tabular-nums">
        {customer.id}
      </span>

      <span className="w-36 flex-shrink-0 text-sm font-medium text-gray-900 truncate">
        <HighlightText text={customer.full_name} tokens={searchTokens} />
      </span>

      <span className="w-28 flex-shrink-0 font-mono text-xs text-gray-400 truncate">
        {customer.pers_nr ? <HighlightText text={customer.pers_nr} tokens={searchTokens} /> : '—'}
      </span>

      <span className="flex-1 min-w-0 text-sm text-gray-500 truncate">
        {formatAddress(customer)
          ? <HighlightText text={formatAddress(customer)} tokens={searchTokens} />
          : '—'}
      </span>

      <span className="w-32 flex-shrink-0 text-sm text-gray-500 truncate">
        {customer.tel ? <HighlightText text={customer.tel} tokens={searchTokens} /> : '—'}
      </span>

      <span className="w-40 flex-shrink-0 text-sm text-gray-500 truncate">
        {customer.email ? <HighlightText text={customer.email} tokens={searchTokens} /> : '—'}
      </span>

      <span className="w-24 flex-shrink-0 text-right text-xs text-gray-400">
        {customer.last_order ?? '—'}
      </span>

      <ChevronRight size={15} className="flex-shrink-0 text-gray-300" />
    </div>
  )
}
