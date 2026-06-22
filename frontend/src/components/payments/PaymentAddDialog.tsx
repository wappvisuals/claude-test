import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addInvoicePayment, getErrorMessage } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: number
  onAdded: () => void
}

export function PaymentAddDialog({ open, onOpenChange, invoiceId, onAdded }: Props) {
  const [sum, setSum] = useState('')
  const [date, setDate] = useState('')
  const [reference, setReference] = useState('')
  const [payerName, setPayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setSum(''); setDate(new Date().toISOString().slice(0, 10)); setReference(''); setPayerName(''); setError(null) }
  }, [open])

  const valid = sum !== '' && Number(sum) >= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true); setError(null)
    try {
      await addInvoicePayment(invoiceId, { sum: Number(sum), date: date || undefined, reference: reference.trim() || undefined, payer_name: payerName.trim() || undefined })
      onAdded()
      onOpenChange(false)
    } catch (err) { setError(getErrorMessage(err)) } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md" onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add payment</DialogTitle>
            <DialogDescription>Record a manual payment against invoice #{invoiceId}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pay-sum" className="text-sm font-medium text-gray-700">Amount <span className="text-red-500">*</span></label>
                <Input id="pay-sum" type="number" min="0" step="0.01" value={sum} onChange={(e) => setSum(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pay-date" className="text-sm font-medium text-gray-700">Date</label>
                <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pay-ref" className="text-sm font-medium text-gray-700">Reference</label>
              <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pay-payer" className="text-sm font-medium text-gray-700">Payer name</label>
              <Input id="pay-payer" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Optional" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>{submitting ? 'Saving…' : 'Add payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
