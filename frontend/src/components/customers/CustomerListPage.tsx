import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useCustomerSearch } from '@/hooks/useCustomerSearch'
import { Users } from 'lucide-react'
import { CustomerSearch } from './CustomerSearch'
import { CustomerTable } from './CustomerTable'
import { ListView, ListViewHeader, ListViewToolbar, ListFooter } from '@/components/ui/ListView'
import type { CustomerListParams } from '@/types/customer'

interface DateFilters {
  last_order_after?: string
  last_order_before?: string
}

const PER_PAGE = 25

export function CustomerListPage() {
  const [query, setQuery]               = useState('')
  const [searchTokens, setSearchTokens] = useState<string[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [page, setPage]                 = useState(1)
  const [dateFilters, setDateFilters]   = useState<DateFilters>({})

  const listParams: CustomerListParams = { page, per_page: PER_PAGE }

  const { data: listData, loading: listLoading, error: listError } =
    useCustomers(isSearchMode ? {} : listParams)

  const { results: searchResults, searching, error: searchError, setParams: setSearchParams } =
    useCustomerSearch()

  function handleSearch(q: string, filters: DateFilters) {
    const trimmed = q.trim()
    setQuery(q)
    setDateFilters(filters)
    setIsSearchMode(trimmed.length > 0)
    setSearchTokens(trimmed ? trimmed.split(/\s+/) : [])
    setPage(1)

    if (trimmed) {
      setSearchParams({
        q: trimmed,
        last_order_after:  filters.last_order_after,
        last_order_before: filters.last_order_before,
        page: 1,
        per_page: PER_PAGE,
      })
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    if (isSearchMode) {
      setSearchParams({
        q: query.trim(),
        last_order_after:  dateFilters.last_order_after,
        last_order_before: dateFilters.last_order_before,
        page: newPage,
        per_page: PER_PAGE,
      })
    }
  }

  const data    = isSearchMode ? searchResults : listData
  const loading = isSearchMode ? searching     : listLoading
  const error   = isSearchMode ? searchError   : listError

  const sectionTitle = isSearchMode ? `Results for "${query.trim()}"` : 'All customers'

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Users size={24} className="text-gray-700" />
          Customers
        </h1>
        <p className="mt-1 text-sm text-gray-500">Browse, search, and manage customer profiles.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ListView>
        <ListViewHeader title={sectionTitle} icon={<Users size={15} />} count={data?.meta.total} />

        <ListViewToolbar>
          <CustomerSearch onSearch={handleSearch} />
        </ListViewToolbar>

        <CustomerTable data={data} loading={loading} searchTokens={searchTokens} />

        {data && (
          <ListFooter
            from={data.meta.from}
            to={data.meta.to}
            total={data.meta.total}
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            noun="customers"
            onPageChange={handlePageChange}
          />
        )}
      </ListView>
    </div>
  )
}
