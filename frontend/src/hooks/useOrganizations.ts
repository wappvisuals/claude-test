import { useState, useEffect, useRef } from 'react'
import { searchOrganizations } from '@/lib/api'
import { getErrorMessage } from '@/lib/api'
import type { Organization } from '@/types/organization'

export function useOrganizations(q: string, debounceMs = 300) {
  const [results, setResults] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      setError(null)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await searchOrganizations(q)
        setResults(res.data)
      } catch (err) {
        setError(getErrorMessage(err))
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [q, debounceMs])

  return { results, loading, error }
}
