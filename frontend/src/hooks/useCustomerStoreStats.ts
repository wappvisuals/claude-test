import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCustomerStoreStats, getErrorMessage } from '@/lib/api'
import type { CustomerStoreStats } from '@/types/storeStats'

interface UseCustomerStoreStatsReturn {
  data: CustomerStoreStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCustomerStoreStats(customerId: number): UseCustomerStoreStatsReturn {
  const [data, setData] = useState<CustomerStoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomerStoreStats(customerId)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [customerId])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
