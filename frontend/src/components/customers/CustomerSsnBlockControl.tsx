import { useState } from 'react'
import { ShieldBan, ShieldOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { blockSsn, unblockSsnByValue, getErrorMessage } from '@/lib/api'

interface Props {
  ssn: string
  blocked: boolean
  /** Bubble the new blocked state up so the profile can update without a refetch. */
  onChange: (blocked: boolean) => void
}

/**
 * Inline control on the customer profile to block / unblock the customer's SSN.
 * Renders a red badge when blocked.
 */
export function CustomerSsnBlockControl({ ssn, blocked, onChange }: Props) {
  const [blockOpen, setBlockOpen] = useState(false)
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBlock(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await blockSsn({ ssn, reason: reason.trim() || null })
      onChange(true)
      setBlockOpen(false)
      setReason('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnblock() {
    await unblockSsnByValue(ssn)
    onChange(false)
  }

  if (blocked) {
    return (
      <>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          <ShieldBan size={12} /> SSN blocked
        </span>
        <button
          type="button"
          onClick={() => setUnblockOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow-sm transition-colors hover:border-[#00C48C] hover:text-[#00C48C]"
        >
          <ShieldOff size={12} /> Unblock
        </button>

        <ConfirmDialog
          open={unblockOpen}
          onOpenChange={setUnblockOpen}
          title="Unblock this SSN?"
          description={<>This SSN (<span className="font-mono">{ssn}</span>) will be able to place orders again.</>}
          confirmLabel="Unblock"
          onConfirm={handleUnblock}
        />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setBlockOpen(true) }}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:border-red-300"
      >
        <ShieldBan size={12} /> Block SSN
      </button>

      <Dialog open={blockOpen} onOpenChange={(o) => !submitting && setBlockOpen(o)}>
        <DialogContent onClose={() => !submitting && setBlockOpen(false)}>
          <form onSubmit={handleBlock}>
            <DialogHeader>
              <DialogTitle>Block this customer's SSN</DialogTitle>
              <DialogDescription>
                A blocked SSN is prevented from placing any orders. Used for fraud / ID-theft protection.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-gray-700">SSN</span>
                <span className="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700">{ssn}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="block-reason" className="text-sm font-medium text-gray-700">Reason</label>
                <Textarea
                  id="block-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this SSN being blocked?"
                  maxLength={1000}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBlockOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? 'Blocking…' : 'Block SSN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
