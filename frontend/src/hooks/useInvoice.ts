import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchInvoice, fetchInvoiceReminders, fetchInvoicePayments, getErrorMessage } from '@/lib/api'
import type { Invoice, InvoiceReminder } from '@/types/invoice'
import type { Payment } from '@/types/payment'

/** Loads an invoice plus its reminders and payments in one hook. */
export function useInvoice(id: number) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [reminders, setReminders] = useState<InvoiceReminder[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
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
      const [inv, rem, pay] = await Promise.all([
        fetchInvoice(id),
        fetchInvoiceReminders(id),
        fetchInvoicePayments(id),
      ])
      if (mountedRef.current) {
        setInvoice(inv)
        setReminders(rem.data)
        setPayments(pay.data)
      }
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { invoice, reminders, payments, loading, error, refetch: load }
}
