import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { HighlightText } from './HighlightText'
import { ListRow, ListCell } from '@/components/ui/ListView'
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
  const address = formatAddress(customer)

  return (
    <ListRow onClick={() => navigate(`/customers/${customer.id}`)}>
      <ListCell className="text-gray-400 tabular-nums">{customer.id}</ListCell>
      <ListCell className="font-medium text-[#1A1A2E]">
        <HighlightText text={customer.full_name} tokens={searchTokens} />
      </ListCell>
      <ListCell className="font-mono text-xs text-gray-400">
        {customer.pers_nr ? <HighlightText text={customer.pers_nr} tokens={searchTokens} /> : '—'}
      </ListCell>
      <ListCell className="max-w-[260px] truncate text-gray-500">
        {address ? <HighlightText text={address} tokens={searchTokens} /> : '—'}
      </ListCell>
      <ListCell className="text-gray-500">
        {customer.tel ? <HighlightText text={customer.tel} tokens={searchTokens} /> : '—'}
      </ListCell>
      <ListCell className="max-w-[200px] truncate text-gray-500">
        {customer.email ? <HighlightText text={customer.email} tokens={searchTokens} /> : '—'}
      </ListCell>
      <ListCell className="text-right text-xs text-gray-400">{customer.last_order ?? '—'}</ListCell>
      <ListCell className="text-right">
        <ChevronRight size={15} className="inline text-gray-300" />
      </ListCell>
    </ListRow>
  )
}
