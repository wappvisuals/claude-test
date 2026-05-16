import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import type { CustomerListParams } from '@/types/customer'

interface SortableHeaderProps {
  label: string
  column: CustomerListParams['sort_by']
  currentSort: { by: string; dir: 'asc' | 'desc' }
  onSort: (col: CustomerListParams['sort_by']) => void
}

export function SortableHeader({ label, column, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort.by === column

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        currentSort.dir === 'asc' ? (
          <ArrowUp size={13} className="text-foreground" />
        ) : (
          <ArrowDown size={13} className="text-foreground" />
        )
      ) : (
        <ChevronsUpDown size={13} className="opacity-40" />
      )}
    </button>
  )
}
