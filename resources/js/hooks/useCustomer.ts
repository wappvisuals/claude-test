import { useState, useEffect, useRef } from 'react'
import { fetchCustomer, getErrorMessage } from '@/lib/api'
import type { Customer } from '@/types/customer'

interface UseCustomerReturn {
  customer: Customer | null
  loading: boolean
  error: string | null
}

export function useCustomer(id: number): UseCustomerReturn {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    setCustomer(null)

    fetchCustomer(id)
      .then((data) => {
        if (mountedRef.current) setCustomer(data)
      })
      .catch((err) => {
        if (mountedRef.current) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
  }, [id])

  return { customer, loading, error }
}
