import { cn } from '@/lib/utils'
import type { GdprStatus } from '@/types/gdpr'

const STATUS_STYLES: Record<GdprStatus, { label: string; className: string }> = {
  flagged:        { label: 'Flagged',        className: 'bg-amber-100 text-amber-800' },
  pending_review: { label: 'Pending Review', className: 'bg-blue-100 text-blue-800' },
  anonymized:     { label: 'Anonymized',     className: 'bg-slate-200 text-slate-700' },
  restored:       { label: 'Restored',       className: 'bg-green-100 text-green-800' },
  rejected:       { label: 'Rejected',       className: 'bg-red-100 text-red-700' },
}

export function GdprStatusBadge({ status, label }: { status: GdprStatus; label?: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', style.className)}>
      {label ?? style.label}
    </span>
  )
}
