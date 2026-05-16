import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Search } from 'lucide-react'

interface DateFilters {
  last_order_after?: string
  last_order_before?: string
}

interface CustomerSearchProps {
  onSearch: (q: string, filters: DateFilters) => void
  initialQuery?: string
}

export function CustomerSearch({ onSearch, initialQuery = '' }: CustomerSearchProps) {
  const [query, setQuery]           = useState(initialQuery)
  const [afterDate, setAfterDate]   = useState('')
  const [beforeDate, setBeforeDate] = useState('')

  function submit() {
    onSearch(query, {
      last_order_after:  afterDate  || undefined,
      last_order_before: beforeDate || undefined,
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (val === '') onSearch('', {})
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search customers…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      <span className="text-sm text-gray-500 whitespace-nowrap">Period:</span>
      <input
        type="date"
        value={afterDate}
        onChange={(e) => setAfterDate(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
        title="From date"
      />
      <span className="text-gray-300 text-sm">–</span>
      <input
        type="date"
        value={beforeDate}
        onChange={(e) => setBeforeDate(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
        title="To date"
      />

      <button
        type="button"
        onClick={submit}
        className="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </div>
  )
}
