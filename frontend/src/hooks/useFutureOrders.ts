import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchFutureOrders, getErrorMessage } from '@/lib/api'
import type { FutureOrderJobList } from '@/types/futureOrder'

export function useFutureOrders(subscriptionId: number) {
  const [data, setData] = useState<FutureOrderJobList | null>(null)
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
      const result = await fetchFutureOrders(subscriptionId)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [subscriptionId])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
