import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CustomerTableRow } from './CustomerTableRow'
import { CustomerTableSkeleton } from './CustomerTableSkeleton'
import type { Customer, PaginatedResponse } from '@/types/customer'

interface CustomerTableProps {
  data: PaginatedResponse<Customer> | null
  loading: boolean
  searchTokens: string[]
  onPageChange: (page: number) => void
}

export function CustomerTable({ data, loading, searchTokens, onPageChange }: CustomerTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
        <span className="w-12 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">ID</span>
        <span className="w-36 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Name</span>
        <span className="w-28 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">SSN</span>
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Address</span>
        <span className="w-32 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</span>
        <span className="w-40 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Email</span>
        <span className="w-24 flex-shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Last Order</span>
        <span className="w-4 flex-shrink-0" />
      </div>

      {loading ? (
        <CustomerTableSkeleton />
      ) : !data || !Array.isArray(data.data) || data.data.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No customers found.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.data.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} searchTokens={searchTokens} />
          ))}
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            {data.meta.from ?? 0}–{data.meta.to ?? 0} of {data.meta.total} customers
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={data.meta.current_page <= 1}
              onClick={() => onPageChange(data.meta.current_page - 1)}
              className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500">
              {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => onPageChange(data.meta.current_page + 1)}
              className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
