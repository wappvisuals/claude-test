import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (q: string) => void
  placeholder?: string
  initialQuery?: string
}

/**
 * Submit-based search bar matching the customer-list style: input with a
 * magnifier icon plus a violet "Search" button. Pressing Enter or the button
 * submits; clearing the input resets the results.
 */
export function SearchBar({ onSearch, placeholder = 'Search…', initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSearch(query)
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (val === '') onSearch('')
  }

  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-[#EBEBF5] bg-white pl-9 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00C48C] focus:border-[#00C48C]"
        />
      </div>
      <button
        type="button"
        onClick={() => onSearch(query)}
        className="rounded-md bg-[#00C48C] px-5 py-2 text-sm font-medium text-white hover:bg-[#00A876] active:bg-[#009267] transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </div>
  )
}
