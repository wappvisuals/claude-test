import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCustomerSubscriptions, getErrorMessage } from '@/lib/api'
import type { SubscriptionGroupList, CustomerSubscriptionParams } from '@/types/subscription'

interface UseCustomerSubscriptionsReturn {
  data: SubscriptionGroupList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCustomerSubscriptions(
  customerId: number,
  params: CustomerSubscriptionParams = {}
): UseCustomerSubscriptionsReturn {
  const [data, setData] = useState<SubscriptionGroupList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const paramsKey = JSON.stringify(params)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomerSubscriptions(customerId, JSON.parse(paramsKey))
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [customerId, paramsKey])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
