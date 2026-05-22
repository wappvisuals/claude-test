import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCustomers, getErrorMessage } from '@/lib/api'
import type { Customer, CustomerListParams, PaginatedResponse } from '@/types/customer'

interface UseCustomersReturn {
  data: PaginatedResponse<Customer> | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCustomers(params: CustomerListParams = {}): UseCustomersReturn {
  const [data, setData] = useState<PaginatedResponse<Customer> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Serialize params for stable useEffect dependency — avoids infinite loops
  // caused by a new object reference being passed on every render
  const paramsKey = JSON.stringify(params)

  // Track whether the component is still mounted so we don't update state
  // after an unmount (e.g. navigating away mid-request)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomers(JSON.parse(paramsKey) as CustomerListParams)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
