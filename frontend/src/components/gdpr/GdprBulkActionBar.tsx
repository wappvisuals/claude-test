import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GdprBulkAction } from '@/types/gdpr'

interface GdprBulkActionBarProps {
  count: number
  disabled?: boolean
  onAction: (action: GdprBulkAction) => void
  onClear: () => void
}

const ACTIONS: { action: GdprBulkAction; label: string; destructive?: boolean }[] = [
  { action: 'flag',      label: 'Flag' },
  { action: 'unflag',    label: 'Unflag' },
  { action: 'anonymize', label: 'Anonymize', destructive: true },
  { action: 'restore',   label: 'Restore' },
  { action: 'reject',    label: 'Reject',    destructive: true },
]

export function GdprBulkActionBar({ count, disabled, onAction, onClear }: GdprBulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="sticky top-2 z-10 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Clear selection"
        >
          <X size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">{count} selected</span>
      </div>
      <div className="flex items-center gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.action}
            size="sm"
            variant={a.destructive ? 'destructive' : 'outline'}
            disabled={disabled}
            onClick={() => onAction(a.action)}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
