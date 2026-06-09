import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { deactivateSubscription, getErrorMessage } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: number
  onDeactivated: () => void
}

export function SubscriptionDeactivateDialog({ open, onOpenChange, subscriptionId, onDeactivated }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setReason(''); setError(null) }
  }, [open])

  const valid = reason.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await deactivateSubscription(subscriptionId, { method: reason.trim() })
      onDeactivated()
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Deactivate subscription #{subscriptionId}</DialogTitle>
            <DialogDescription>This sets the subscription inactive and records the reason.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="deactivate-reason" className="text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
            <Textarea id="deactivate-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this subscription being deactivated?" />
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Back</Button>
            <Button type="submit" variant="destructive" disabled={!valid || submitting}>{submitting ? 'Deactivating…' : 'Deactivate'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
