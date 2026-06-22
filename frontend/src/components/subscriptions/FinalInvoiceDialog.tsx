import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setSubscriptionFinalInvoice, getErrorMessage } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: number
  /** Current value — when set, the dialog offers "unset". */
  current: string | null
  onSaved: () => void
}

export function FinalInvoiceDialog({ open, onOpenChange, subscriptionId, current, onSaved }: Props) {
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setDate(current ?? new Date().toISOString().slice(0, 10)); setError(null) }
  }, [open, current])

  async function submit(action: 'set' | 'unset') {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await setSubscriptionFinalInvoice(subscriptionId, action, action === 'set' ? date : undefined)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md" onClose={() => !submitting && onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Final invoice</DialogTitle>
          <DialogDescription>Set or clear the final-invoice flag for subscription #{subscriptionId}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fi-date" className="text-sm font-medium text-gray-700">Final invoice date</label>
          <Input id="fi-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <DialogFooter>
          {current && <Button variant="outline" onClick={() => submit('unset')} disabled={submitting}>Unset</Button>}
          <Button onClick={() => submit('set')} disabled={!date || submitting}>{submitting ? 'Saving…' : 'Set'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
