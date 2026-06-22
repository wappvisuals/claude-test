import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchOrderInvoices, getErrorMessage } from '@/lib/api'
import type { InvoiceList } from '@/types/invoice'

export function useOrderInvoices(orderId: number) {
  const [data, setData] = useState<InvoiceList | null>(null)
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
      const result = await fetchOrderInvoices(orderId)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [orderId])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
