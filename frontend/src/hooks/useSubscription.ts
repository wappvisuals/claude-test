import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSubscription, getErrorMessage } from '@/lib/api'
import type { Subscription } from '@/types/subscription'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSubscription(id: number): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
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
      const result = await fetchSubscription(id)
      if (mountedRef.current) setSubscription(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { subscription, loading, error, refetch: load }
}
