import { useMemo, useState } from 'react'
import { ArrowRight, Pencil, Plus, Trash2, ShieldCheck, FileClock, User, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomerChanges } from '@/hooks/useCustomerChanges'
import type { CustomerChange, CustomerChangeBatch } from '@/types/customerChange'

// ─── Action categories ──────────────────────────────────────────────────────────

type Category = 'all' | 'edit' | 'create' | 'delete' | 'gdpr'

function categoryOf(action: string): Exclude<Category, 'all'> {
  const a = action.toLowerCase()
  if (a.includes('create') || a.includes('add')) return 'create'
  if (a.includes('delete') || a.includes('remove')) return 'delete'
  if (a.includes('anonym') || a.includes('gdpr') || a.includes('restore')) return 'gdpr'
  return 'edit'
}

const CATEGORY_META: Record<Exclude<Category, 'all'>, { Icon: typeof Pencil; tint: string; ring: string }> = {
  edit:   { Icon: Pencil,      tint: 'text-blue-600 bg-blue-50',     ring: 'ring-blue-100' },
  create: { Icon: Plus,        tint: 'text-green-600 bg-green-50',   ring: 'ring-green-100' },
  delete: { Icon: Trash2,      tint: 'text-red-600 bg-red-50',       ring: 'ring-red-100' },
  gdpr:   { Icon: ShieldCheck, tint: 'text-violet-600 bg-violet-50', ring: 'ring-violet-100' },
}

const FILTERS: { key: Category; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: 'edit',   label: 'Edits' },
  { key: 'create', label: 'Created' },
  { key: 'delete', label: 'Deleted' },
  { key: 'gdpr',   label: 'GDPR' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** snake_case / camelCase field name → "Title Case" label. */
function humanizeField(field: string): string {
  return field
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDateTime(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

/** Compact relative time, e.g. "2d ago". Falls back to absolute for old dates. */
function relativeTime(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

/** Bucket a date into a section label relative to today. */
function dateBucket(value: string | null): string {
  if (!value) return 'Unknown date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown date'
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const dayMs = 86_400_000
  const days = Math.floor((startOfToday.getTime() - new Date(d).setHours(0, 0, 0, 0)) / dayMs)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days <= 6) return 'Earlier this week'
  if (days <= 30) return 'Earlier this month'
  return 'Older'
}

/** Group the flat change rows by their batch id, newest batch first. */
function groupByBatch(changes: CustomerChange[]): CustomerChangeBatch[] {
  const map = new Map<number, CustomerChangeBatch>()
  for (const c of changes) {
    let batch = map.get(c.change_batch_id)
    if (!batch) {
      batch = { batch_id: c.change_batch_id, action: c.change_action, date: c.change_date, user: c.user, changes: [] }
      map.set(c.change_batch_id, batch)
    }
    batch.changes.push(c)
  }
  return [...map.values()].sort((a, b) => b.batch_id - a.batch_id)
}

// ─── Diff value chip ──────────────────────────────────────────────────────────

function ValueChip({ value, kind }: { value: string | null; kind: 'old' | 'new' }) {
  const empty = !value
  const base = 'max-w-[180px] truncate rounded px-1.5 py-0.5 font-mono text-xs'
  if (kind === 'old') {
    return (
      <span
        title={value ?? 'empty'}
        className={`${base} ${empty ? 'text-gray-300 italic' : 'bg-red-50 text-red-700 line-through decoration-red-300'}`}
      >
        {value || 'empty'}
      </span>
    )
  }
  return (
    <span title={value ?? 'empty'} className={`${base} ${empty ? 'text-gray-300 italic' : 'bg-green-50 text-green-700'}`}>
      {value || 'empty'}
    </span>
  )
}

// ─── Batch entry ──────────────────────────────────────────────────────────────

function BatchEntry({ batch, last }: { batch: CustomerChangeBatch; last: boolean }) {
  const { Icon, tint, ring } = CATEGORY_META[categoryOf(batch.action)]
  return (
    <div className="relative flex gap-3 pb-5">
      {!last && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-gray-200" />}
      <span className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${tint}`}>
        <span className={`absolute inset-0 rounded-full ring-1 ${ring}`} />
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold capitalize text-gray-800">
            {batch.action}
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              {batch.changes.length} {batch.changes.length === 1 ? 'field' : 'fields'}
            </span>
          </p>
          <span className="shrink-0 text-xs text-gray-400" title={formatDateTime(batch.date)}>
            {relativeTime(batch.date)}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
          <User size={11} /> {batch.user?.username || 'System'}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
          {batch.changes.map((c) => (
            <li key={c.change_id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-24 font-medium text-gray-600">{humanizeField(c.change_field)}</span>
              <ValueChip value={c.change_old_value} kind="old" />
              <ArrowRight size={12} className="text-gray-400" />
              <ValueChip value={c.change_new_value} kind="new" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

/** Timeline body — rendered inside the change-log drawer (no card chrome). */
export function CustomerChangeLogContent({ customerId }: { customerId: number }) {
  const { data, loading, error } = useCustomerChanges(customerId)
  const [filter, setFilter] = useState<Category>('all')
  const [query, setQuery] = useState('')

  const allBatches = useMemo(() => groupByBatch(data?.data ?? []), [data])

  // Apply the action filter + field-name search, dropping empty batches.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allBatches
      .filter((b) => filter === 'all' || categoryOf(b.action) === filter)
      .map((b) => {
        if (!q) return b
        const changes = b.changes.filter(
          (c) =>
            humanizeField(c.change_field).toLowerCase().includes(q) ||
            c.change_field.toLowerCase().includes(q)
        )
        return { ...b, changes }
      })
      .filter((b) => b.changes.length > 0)
  }, [allBatches, filter, query])

  const totalChanges = useMemo(() => allBatches.reduce((n, b) => n + b.changes.length, 0), [allBatches])

  // Bucket the filtered batches into date sections (input is already newest-first).
  const sections = useMemo(() => {
    const out: { label: string; batches: CustomerChangeBatch[] }[] = []
    for (const b of filtered) {
      const label = dateBucket(b.date)
      const last = out[out.length - 1]
      if (last && last.label === label) last.batches.push(b)
      else out.push({ label, batches: [b] })
    }
    return out
  }, [filtered])

  if (error) {
    return <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (allBatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <FileClock size={22} />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-600">No changes yet</p>
          <p className="text-xs text-gray-400">Edits to this customer will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="sticky -top-5 z-10 -mx-5 -mt-5 flex flex-col gap-2.5 border-b border-gray-100 bg-white px-5 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">
            {totalChanges} {totalChanges === 1 ? 'change' : 'changes'} total
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search field…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={[
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped timeline */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <SearchX size={22} className="text-gray-300" />
          <p className="text-sm text-gray-400">No changes match your filters.</p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.label}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{section.label}</p>
            <div className="flex flex-col">
              {section.batches.map((b, i) => (
                <BatchEntry key={b.batch_id} batch={b} last={i === section.batches.length - 1} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
