import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSubscriptionEventLog, getErrorMessage } from '@/lib/api'
import type { EventLogList } from '@/types/eventLog'

export function useSubscriptionEventLog(subscriptionId: number) {
  const [data, setData] = useState<EventLogList | null>(null)
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
      const result = await fetchSubscriptionEventLog(subscriptionId)
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
