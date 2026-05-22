import { useState } from 'react'
import { AxiosError } from 'axios'
import { updateCustomer, getErrorMessage } from '@/lib/api'
import type { Customer, CustomerUpdatePayload } from '@/types/customer'

export function useUpdateCustomer() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function update(id: number, payload: CustomerUpdatePayload): Promise<Customer | null> {
    setSaving(true)
    setError(null)
    setFieldErrors({})

    try {
      return await updateCustomer(id, payload)
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 422) {
        const raw = err.response.data?.errors ?? {}
        const flat: Record<string, string> = {}
        for (const [field, messages] of Object.entries(raw)) {
          flat[field] = (messages as string[])[0]
        }
        setFieldErrors(flat)
      } else {
        setError(getErrorMessage(err))
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  return { update, saving, error, fieldErrors }
}
