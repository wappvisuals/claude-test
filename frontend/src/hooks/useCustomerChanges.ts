import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCustomerChanges, getErrorMessage } from '@/lib/api'
import type { CustomerChangeList, CustomerChangeListParams } from '@/types/customerChange'

interface UseCustomerChangesReturn {
  data: CustomerChangeList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCustomerChanges(
  customerId: number,
  params: CustomerChangeListParams = {}
): UseCustomerChangesReturn {
  const [data, setData] = useState<CustomerChangeList | null>(null)
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
      const result = await fetchCustomerChanges(customerId, JSON.parse(paramsKey) as CustomerChangeListParams)
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
