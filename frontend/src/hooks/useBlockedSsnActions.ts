import { useState, useCallback } from 'react'
import { blockSsn, unblockSsn, getErrorMessage } from '@/lib/api'
import type { BlockSsnPayload } from '@/types/blockedSsn'

interface UseBlockedSsnActionsReturn {
  submitting: boolean
  error: string | null
  clearError: () => void
  add: (payload: BlockSsnPayload) => Promise<boolean>
  remove: (id: number) => Promise<boolean>
}

export function useBlockedSsnActions(): UseBlockedSsnActionsReturn {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setSubmitting(true)
    setError(null)
    try {
      await fn()
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setSubmitting(false)
    }
  }, [])

  return {
    submitting,
    error,
    clearError: () => setError(null),
    add: (payload) => run(() => blockSsn(payload)),
    remove: (id) => run(() => unblockSsn(id)),
  }
}
