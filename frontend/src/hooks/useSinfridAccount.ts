import { useState, useEffect, useCallback, useRef } from 'react'
import { AxiosError } from 'axios'
import { fetchSinfridAccount, getErrorMessage } from '@/lib/api'
import type { SinfridAccount } from '@/types/sinfrid'

interface UseSinfridAccountReturn {
  account: SinfridAccount | null
  loading: boolean
  /** True when the customer simply has no Sinfrid account (404) — not an error. */
  notFound: boolean
  error: string | null
  refetch: () => void
}

export function useSinfridAccount(customerId: number): UseSinfridAccountReturn {
  const [account, setAccount] = useState<SinfridAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const result = await fetchSinfridAccount(customerId)
      if (mountedRef.current) setAccount(result)
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof AxiosError && err.response?.status === 404) {
        setNotFound(true)
        setAccount(null)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [customerId])

  useEffect(() => { load() }, [load])

  return { account, loading, notFound, error, refetch: load }
}
