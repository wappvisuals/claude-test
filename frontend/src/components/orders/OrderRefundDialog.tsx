import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { refundOrder, getErrorMessage } from '@/lib/api'
import type { OrderLineItem } from '@/types/order'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  total: number
  lineItems: OrderLineItem[]
  onRefunded: () => void
}

export function OrderRefundDialog({ open, onOpenChange, orderId, total, lineItems, onRefunded }: Props) {
  const [mode, setMode] = useState<'full' | 'partial'>('full')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setMode('full'); setAmounts({}); setReason(''); setError(null) }
  }, [open])

  const partialTotal = Object.values(amounts).reduce((n, v) => n + (Number(v) || 0), 0)
  const valid = mode === 'full' ? total > 0 : partialTotal > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const lines = mode === 'partial'
        ? lineItems
            .map((li, i) => ({ rowid: li.rowid, prod_id: li.prod_id, amount: Number(amounts[li.rowid ?? `idx-${i}`]) || 0 }))
            .filter((l) => l.amount > 0)
        : undefined
      await refundOrder(orderId, { mode, reason: reason.trim() || undefined, lines })
      onRefunded()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-lg" onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Refund order #{orderId}</DialogTitle>
            <DialogDescription>Refund the full order or specific line items.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(['full', 'partial'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${mode === m ? 'border-[#00C48C] bg-[#E8FBF5] text-[#00A876]' : 'border-[#EBEBF5] text-gray-500 hover:bg-gray-50'}`}
                >
                  {m}{m === 'full' ? ` (${total})` : ''}
                </button>
              ))}
            </div>

            {mode === 'partial' && (
              <div className="flex flex-col gap-2">
                {lineItems.map((li, i) => {
                  const key = li.rowid ?? `idx-${i}`
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="flex-1 truncate text-[13px] text-gray-700">{li.name ?? li.prod_id} <span className="text-gray-400">({li.price})</span></span>
                      <Input type="number" min="0" step="0.01" className="w-28" placeholder="0.00" value={amounts[key] ?? ''} onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))} />
                    </div>
                  )
                })}
                <p className="text-right text-[12px] text-gray-500">Refund total: <span className="font-medium">{partialTotal.toFixed(2)}</span></p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="refund-reason" className="text-sm font-medium text-gray-700">Reason</label>
              <Textarea id="refund-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional…" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={!valid || submitting}>{submitting ? 'Refunding…' : 'Refund'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
