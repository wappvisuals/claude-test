import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useCustomerSearch } from '@/hooks/useCustomerSearch'
import { CustomerSearch } from './CustomerSearch'
import { CustomerTable } from './CustomerTable'
import type { CustomerListParams, CustomerStatus } from '@/types/customer'

type ActiveTab = 'all' | CustomerStatus

const TABS: { key: ActiveTab; label: string }[] = [
  { key: 'all',      label: 'All customers' },
  { key: 'active',   label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'blocked',  label: 'Blocked' },
]

interface DateFilters {
  last_order_after?: string
  last_order_before?: string
}

const PER_PAGE = 25

export function CustomerListPage() {
  const [activeTab, setActiveTab]       = useState<ActiveTab>('all')
  const [query, setQuery]               = useState('')
  const [searchTokens, setSearchTokens] = useState<string[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [page, setPage]                 = useState(1)
  const [dateFilters, setDateFilters]   = useState<DateFilters>({})

  const activeStatus: CustomerStatus[] = activeTab === 'all' ? [] : [activeTab]

  const listParams: CustomerListParams = {
    page,
    per_page: PER_PAGE,
    status: activeStatus.length > 0 ? activeStatus : undefined,
  }

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
        status: activeStatus.length > 0 ? activeStatus : undefined,
        last_order_after:  filters.last_order_after,
        last_order_before: filters.last_order_before,
        page: 1,
        per_page: PER_PAGE,
      })
    }
  }

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab)
    setPage(1)
    const newStatus: CustomerStatus[] = tab === 'all' ? [] : [tab]

    if (isSearchMode && query.trim()) {
      setSearchParams({
        q: query.trim(),
        status: newStatus.length > 0 ? newStatus : undefined,
        last_order_after:  dateFilters.last_order_after,
        last_order_before: dateFilters.last_order_before,
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
        status: activeStatus.length > 0 ? activeStatus : undefined,
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

  const sectionTitle = isSearchMode
    ? `Results for "${query.trim()}"`
    : activeTab === 'all'
      ? 'All customers'
      : `${TABS.find((t) => t.key === activeTab)?.label} customers`

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Customers</h1>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CustomerSearch onSearch={handleSearch} />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">{sectionTitle}</h2>
        <CustomerTable
          data={data}
          loading={loading}
          searchTokens={searchTokens}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
