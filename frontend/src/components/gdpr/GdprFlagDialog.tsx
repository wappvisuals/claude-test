import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fetchGdprExclusionTypes, getErrorMessage } from '@/lib/api'
import type { GdprExclusionOption, GdprExclusionType } from '@/types/gdpr'

interface GdprFlagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string | null
  submitting: boolean
  error: string | null
  onSubmit: (type: GdprExclusionType) => Promise<boolean>
}

export function GdprFlagDialog({ open, onOpenChange, customerName, submitting, error, onSubmit }: GdprFlagDialogProps) {
  const [options, setOptions] = useState<GdprExclusionOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [selected, setSelected] = useState<GdprExclusionType | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setOptionsError(null)
    let active = true
    fetchGdprExclusionTypes()
      .then((opts) => { if (active) setOptions(opts) })
      .catch((err) => { if (active) setOptionsError(getErrorMessage(err)) })
    return () => { active = false }
  }, [open])

  async function handleSubmit() {
    if (!selected || submitting) return
    const ok = await onSubmit(selected)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent onClose={() => !submitting && onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Flag for GDPR exclusion</DialogTitle>
          <DialogDescription>
            {customerName ? <>Flag <span className="font-medium text-gray-700">{customerName}</span> with an exclusion type.</> : 'Select an exclusion type.'}
          </DialogDescription>
        </DialogHeader>

        {optionsError && <p className="text-sm text-red-500">{optionsError}</p>}

        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <label
              key={opt.type}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                selected === opt.type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="exclusion_type"
                value={opt.type}
                checked={selected === opt.type}
                onChange={() => setSelected(opt.type)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.type}</p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
            </label>
          ))}
          {options.length === 0 && !optionsError && (
            <p className="text-sm text-gray-400">Loading exclusion types…</p>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selected || submitting}>
            {submitting ? 'Flagging…' : 'Flag customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
