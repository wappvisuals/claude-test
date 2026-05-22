import { useState } from 'react'
import { AxiosError } from 'axios'
import { upsertOrganization } from '@/lib/api'
import { getErrorMessage } from '@/lib/api'
import type { Customer } from '@/types/customer'

export function useOrganizationUpsert() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function upsert(
    customerId: number,
    payload: { organization_id: string; name?: string | null }
  ): Promise<Customer | null> {
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      const customer = await upsertOrganization(customerId, payload)
      return customer
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 422) {
        const errors: Record<string, string[]> = err.response.data?.errors ?? {}
        setFieldErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]])))
        setError(err.response.data?.message ?? 'Validation error.')
      } else {
        setError(getErrorMessage(err))
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  return { upsert, saving, error, fieldErrors }
}
