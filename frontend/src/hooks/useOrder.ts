import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchOrder, getErrorMessage } from '@/lib/api'
import type { Order } from '@/types/order'

interface UseOrderReturn {
  order: Order | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOrder(id: number): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null)
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
      const result = await fetchOrder(id)
      if (mountedRef.current) setOrder(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { order, loading, error, refetch: load }
}
