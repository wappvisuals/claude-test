import { useState, useEffect, useRef, useCallback } from 'react'
import { searchCustomers, getErrorMessage } from '@/lib/api'
import type { Customer, CustomerSearchParams, PaginatedResponse } from '@/types/customer'

interface UseCustomerSearchReturn {
  results: PaginatedResponse<Customer> | null
  searching: boolean
  error: string | null
  setParams: (params: CustomerSearchParams) => void
}

const DEBOUNCE_MS = 300

export function useCustomerSearch(): UseCustomerSearchReturn {
  const [params, setParams] = useState<CustomerSearchParams | null>(null)
  const [results, setResults] = useState<PaginatedResponse<Customer> | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    // Clear results and skip the request when query is blank
    if (!params || !params.q.trim()) {
      setResults(null)
      setSearching(false)
      return
    }

    // Mark searching immediately so the UI reacts on keystroke, not after the delay
    setSearching(true)
    setError(null)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchCustomers(params)
        if (mountedRef.current) setResults(data)
      } catch (err) {
        if (mountedRef.current) {
          setError(getErrorMessage(err))
          setResults(null)
        }
      } finally {
        if (mountedRef.current) setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [params])

  // Stable setter — wraps setState so callers never need to import useState
  const handleSetParams = useCallback((next: CustomerSearchParams) => {
    setParams(next)
  }, [])

  return { results, searching, error, setParams: handleSetParams }
}
