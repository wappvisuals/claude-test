import { useState, useCallback } from 'react'
import {
  gdprBulkAction,
  gdprFlag,
  gdprUnflag,
  gdprUpdateStatus,
  gdprAnonymize,
  gdprDeanonymize,
  getErrorMessage,
} from '@/lib/api'
import type { GdprBulkActionPayload, GdprExclusionType, GdprStatus } from '@/types/gdpr'

interface UseGdprActionsReturn {
  submitting: boolean
  error: string | null
  clearError: () => void
  flag: (customerId: number, type: GdprExclusionType) => Promise<boolean>
  unflag: (customerId: number) => Promise<boolean>
  updateStatus: (customerId: number, status: GdprStatus) => Promise<boolean>
  anonymize: (customerId: number) => Promise<boolean>
  deanonymize: (customerId: number) => Promise<boolean>
  bulk: (payload: GdprBulkActionPayload) => Promise<boolean>
}

export function useGdprActions(): UseGdprActionsReturn {
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
    flag: (customerId, type) => run(() => gdprFlag(customerId, type)),
    unflag: (customerId) => run(() => gdprUnflag(customerId)),
    updateStatus: (customerId, status) => run(() => gdprUpdateStatus(customerId, status)),
    anonymize: (customerId) => run(() => gdprAnonymize(customerId)),
    deanonymize: (customerId) => run(() => gdprDeanonymize(customerId)),
    bulk: (payload) => run(() => gdprBulkAction(payload)),
  }
}
