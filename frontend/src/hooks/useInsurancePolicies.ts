import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCustomerPolicies, getErrorMessage } from '@/lib/api'
import type { InsurancePolicyList } from '@/types/insurancePolicy'

interface UseInsurancePoliciesReturn {
  data: InsurancePolicyList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useInsurancePolicies(customerId: number): UseInsurancePoliciesReturn {
  const [data, setData] = useState<InsurancePolicyList | null>(null)
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
      const result = await fetchCustomerPolicies(customerId)
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [customerId])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
