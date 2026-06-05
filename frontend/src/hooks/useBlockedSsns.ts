import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchBlockedSsns, getErrorMessage } from '@/lib/api'
import type { BlockedSsnList, BlockedSsnListParams } from '@/types/blockedSsn'

interface UseBlockedSsnsReturn {
  data: BlockedSsnList | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBlockedSsns(params: BlockedSsnListParams = {}): UseBlockedSsnsReturn {
  const [data, setData] = useState<BlockedSsnList | null>(null)
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
      const result = await fetchBlockedSsns(JSON.parse(paramsKey) as BlockedSsnListParams)
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
