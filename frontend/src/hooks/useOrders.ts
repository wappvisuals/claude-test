import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchOrders, getErrorMessage } from '@/lib/api'
import type { OrderList } from '@/types/order'

export interface OrderListParams {
  status?: string
  date_from?: string
  date_to?: string
  q?: string
  per_page?: number
  page?: number
}

interface UseOrdersReturn {
  data: OrderList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOrders(params: OrderListParams = {}): UseOrdersReturn {
  const [data, setData] = useState<OrderList | null>(null)
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
      const result = await fetchOrders(JSON.parse(paramsKey))
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
