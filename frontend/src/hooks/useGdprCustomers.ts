import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchGdprCustomers, getErrorMessage } from '@/lib/api'
import type { GdprCustomerList, GdprListParams } from '@/types/gdpr'

interface UseGdprCustomersReturn {
  data: GdprCustomerList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useGdprCustomers(params: GdprListParams = {}): UseGdprCustomersReturn {
  const [data, setData] = useState<GdprCustomerList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = JSON.stringify(params)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchGdprCustomers(JSON.parse(paramsKey) as GdprListParams)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [paramsKey])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
