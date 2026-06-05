import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BlockSsnPayload } from '@/types/blockedSsn'

interface BlockedSsnAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  error: string | null
  onSubmit: (payload: BlockSsnPayload) => Promise<boolean>
}

export function BlockedSsnAddDialog({ open, onOpenChange, submitting, error, onSubmit }: BlockedSsnAddDialogProps) {
  const [ssn, setSsn] = useState('')
  const [reason, setReason] = useState('')

  // Reset the form whenever the dialog is (re)opened
  useEffect(() => {
    if (open) {
      setSsn('')
      setReason('')
    }
  }, [open])

  const trimmedSsn = ssn.trim()
  const valid = trimmedSsn.length >= 10 && trimmedSsn.length <= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    const ok = await onSubmit({ ssn: trimmedSsn, reason: reason.trim() || null })
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Block an SSN</DialogTitle>
            <DialogDescription>
              Blocked SSNs are prevented from placing any orders. Used for fraud / ID-theft protection.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ssn" className="text-sm font-medium text-gray-700">
                SSN <span className="text-red-500">*</span>
              </label>
              <Input
                id="ssn"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder="e.g. 19850101-1234"
                autoFocus
              />
              <p className="text-xs text-gray-400">10–20 characters.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                Reason
              </label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this SSN being blocked?"
                maxLength={1000}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? 'Blocking…' : 'Block SSN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
