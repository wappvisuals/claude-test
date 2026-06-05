import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Listing primitives matching the in-profile subscription/order list style:
 * a white rounded card, a header bar, an optional `#FAFBFF` toolbar strip, and
 * an uppercase-gray table with `#F0F1F7` row borders and teal (#00C48C) accents.
 * Used by every listing page so they share one visual language.
 */

export function ListView({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-white border border-[#EBEBF5] rounded-xl overflow-hidden', className)}>
      {children}
    </div>
  )
}

export function ListViewHeader({
  title,
  icon,
  count,
  children,
}: {
  title: React.ReactNode
  icon?: React.ReactNode
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-4 border-b border-[#F0F1F7]">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-[14px] font-semibold text-[#1A1A2E]">{title}</span>
        {count !== undefined && (
          <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full leading-none">{count}</span>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export function ListViewToolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-3 flex flex-wrap items-center gap-3 border-b border-[#F0F1F7] bg-[#FAFBFF]', className)}>
      {children}
    </div>
  )
}

export function ListTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full min-w-max', className)}>{children}</table>
    </div>
  )
}

export function ListThead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#F0F1F7] bg-[#FAFBFF]/40">{children}</tr>
    </thead>
  )
}

export function ListTh({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th className={cn('text-[11px] text-gray-400 font-medium text-left px-4 py-3 whitespace-nowrap uppercase tracking-wide', className)}>
      {children}
    </th>
  )
}

export function ListRow({
  className,
  onClick,
  selected,
  children,
}: {
  className?: string
  onClick?: () => void
  selected?: boolean
  children: React.ReactNode
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-[#F0F1F7] last:border-0 transition-colors',
        onClick && 'cursor-pointer',
        selected ? 'bg-[#E8FBF5]/50' : 'hover:bg-[#FAFBFF]',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function ListCell({ className, colSpan, children }: { className?: string; colSpan?: number; children?: React.ReactNode }) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3 text-[13px] text-[#1A1A2E] align-middle', className)}>
      {children}
    </td>
  )
}

export function ListEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 text-[13px] text-gray-400 italic">
        {message}
      </td>
    </tr>
  )
}

interface ListFooterProps {
  from: number | null
  to: number | null
  total: number
  currentPage: number
  lastPage: number
  noun?: string
  onPageChange: (page: number) => void
}

export function ListFooter({ from, to, total, currentPage, lastPage, noun = 'items', onPageChange }: ListFooterProps) {
  if (lastPage <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-[#F0F1F7] px-5 py-3">
      <p className="text-[12px] text-gray-400">
        {from ?? 0}–{to ?? 0} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-md border border-[#EBEBF5] p-1 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#00C48C] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[12px] text-gray-500">{currentPage} / {lastPage}</span>
        <button
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-md border border-[#EBEBF5] p-1 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#00C48C] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
