import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useGdprCustomers } from '@/hooks/useGdprCustomers'
import { useGdprActions } from '@/hooks/useGdprActions'
import { GdprStatusBadge } from './GdprStatusBadge'
import { GdprBulkActionBar } from './GdprBulkActionBar'
import { GdprFlagDialog } from './GdprFlagDialog'
import type { GdprBulkAction, GdprCustomer, GdprExclusionType, GdprStatus } from '@/types/gdpr'

const PER_PAGE = 25

const TABS: { key: 'all' | GdprStatus; label: string }[] = [
  { key: 'all',            label: 'All' },
  { key: 'flagged',        label: 'Flagged' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'anonymized',     label: 'Anonymized' },
  { key: 'restored',       label: 'Restored' },
  { key: 'rejected',       label: 'Rejected' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString()
}

// Pending confirm action — drives the shared ConfirmDialog.
type PendingConfirm =
  | { kind: 'anonymize'; row: GdprCustomer }
  | { kind: 'restore'; row: GdprCustomer }
  | { kind: 'bulk'; action: GdprBulkAction; ids: number[] }

const BULK_LABELS: Record<GdprBulkAction, string> = {
  flag: 'Flag', unflag: 'Unflag', anonymize: 'Anonymize', restore: 'Restore', reject: 'Reject',
}

export function GdprListPage() {
  const [tab, setTab] = useState<'all' | GdprStatus>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [flagFor, setFlagFor] = useState<GdprCustomer | null>(null)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)

  const status = tab === 'all' ? undefined : [tab]
  const { data, loading, error, refetch } = useGdprCustomers({ status, page, per_page: PER_PAGE })
  const actions = useGdprActions()

  const rows = useMemo(() => data?.data ?? [], [data])
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.customer_id))
  const someSelected = rows.some((r) => selected.has(r.customer_id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) rows.forEach((r) => next.delete(r.customer_id))
      else rows.forEach((r) => next.add(r.customer_id))
      return next
    })
  }

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function changeTab(next: 'all' | GdprStatus) {
    setTab(next)
    setPage(1)
    setSelected(new Set())
  }

  async function afterMutation(ok: boolean) {
    if (ok) {
      setSelected(new Set())
      refetch()
    }
  }

  function requestBulk(action: GdprBulkAction) {
    const ids = [...selected]
    if (ids.length === 0) return
    // Destructive actions go through the confirm dialog; others run immediately.
    if (action === 'anonymize' || action === 'reject') {
      setConfirm({ kind: 'bulk', action, ids })
    } else {
      actions.bulk({ action, customers: ids }).then(afterMutation)
    }
  }

  async function runConfirm() {
    if (!confirm) return
    if (confirm.kind === 'anonymize') await afterMutation(await actions.anonymize(confirm.row.customer_id))
    else if (confirm.kind === 'restore') await afterMutation(await actions.deanonymize(confirm.row.customer_id))
    else await afterMutation(await actions.bulk({ action: confirm.action, customers: confirm.ids }))
  }

  async function handleFlag(type: GdprExclusionType) {
    if (!flagFor) return false
    const ok = await actions.flag(flagFor.customer_id, type)
    await afterMutation(ok)
    return ok
  }

  // Contextual per-row actions based on the GDPR state machine.
  function rowActions(row: GdprCustomer) {
    switch (row.status) {
      case 'flagged':
        return (
          <>
            <Button size="sm" variant="outline" disabled={actions.submitting}
              onClick={() => actions.updateStatus(row.customer_id, 'pending_review').then(afterMutation)}>
              Send to review
            </Button>
            <Button size="sm" variant="ghost" disabled={actions.submitting}
              onClick={() => actions.unflag(row.customer_id).then(afterMutation)}>
              Unflag
            </Button>
          </>
        )
      case 'pending_review':
        return (
          <>
            <Button size="sm" variant="destructive" disabled={actions.submitting}
              onClick={() => setConfirm({ kind: 'anonymize', row })}>
              Anonymize
            </Button>
            <Button size="sm" variant="ghost" disabled={actions.submitting}
              onClick={() => actions.updateStatus(row.customer_id, 'rejected').then(afterMutation)}>
              Reject
            </Button>
          </>
        )
      case 'anonymized':
        return (
          <Button size="sm" variant="outline" disabled={actions.submitting}
            onClick={() => setConfirm({ kind: 'restore', row })}>
            Restore
          </Button>
        )
      default:
        return (
          <Button size="sm" variant="ghost" disabled={actions.submitting} onClick={() => setFlagFor(row)}>
            Re-flag
          </Button>
        )
    }
  }

  const confirmProps = confirm && (() => {
    if (confirm.kind === 'anonymize') return {
      title: 'Anonymize customer?',
      description: <>PII for <span className="font-medium">{confirm.row.customer_name}</span> will be masked. A reversible encrypted backup is kept.</>,
      confirmLabel: 'Anonymize', destructive: true,
    }
    if (confirm.kind === 'restore') return {
      title: 'Restore customer?',
      description: <>Original PII for <span className="font-medium">{confirm.row.customer_name}</span> will be restored from the encrypted backup.</>,
      confirmLabel: 'Restore', destructive: false,
    }
    return {
      title: `${BULK_LABELS[confirm.action]} ${confirm.ids.length} customer${confirm.ids.length > 1 ? 's' : ''}?`,
      description: `This will ${BULK_LABELS[confirm.action].toLowerCase()} the selected customers.`,
      confirmLabel: BULK_LABELS[confirm.action], destructive: true,
    }
  })()

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShieldCheck size={24} className="text-gray-700" /> GDPR Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">Flag, anonymize, and restore customers for GDPR compliance.</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeTab(t.key)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {actions.error && <p className="text-sm text-red-500">{actions.error}</p>}

      <GdprBulkActionBar
        count={selected.size}
        disabled={actions.submitting}
        onAction={requestBulk}
        onClear={() => setSelected(new Set())}
      />

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-48">Exclusion type</TableHead>
              <TableHead className="w-28">Flagged</TableHead>
              <TableHead className="w-32">Requested by</TableHead>
              <TableHead className="w-56 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-gray-400">No GDPR records found.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.customer_id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.customer_id)}
                      onCheckedChange={() => toggleRow(row.customer_id)}
                      aria-label={`Select ${row.customer_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link to={`/customers/${row.customer_id}`} className="font-medium text-gray-900 hover:underline">
                      {row.customer_name || `#${row.customer_id}`}
                    </Link>
                  </TableCell>
                  <TableCell><GdprStatusBadge status={row.status} label={row.status_label} /></TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {row.exclusion_type
                      ? <span title={row.exclusion_description ?? undefined}>{row.exclusion_type}</span>
                      : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(row.flagged_at)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{row.requested_by?.username || 'System'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">{rowActions(row)}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">{data.meta.from ?? 0}–{data.meta.to ?? 0} of {data.meta.total}</p>
            <div className="flex items-center gap-2">
              <button disabled={data.meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-500">{data.meta.current_page} / {data.meta.last_page}</span>
              <button disabled={data.meta.current_page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <GdprFlagDialog
        open={flagFor !== null}
        onOpenChange={(o) => !o && setFlagFor(null)}
        customerName={flagFor?.customer_name}
        submitting={actions.submitting}
        error={actions.error}
        onSubmit={handleFlag}
      />

      {confirmProps && (
        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(o) => !o && setConfirm(null)}
          title={confirmProps.title}
          description={confirmProps.description}
          confirmLabel={confirmProps.confirmLabel}
          destructive={confirmProps.destructive}
          onConfirm={runConfirm}
        />
      )}
    </div>
  )
}
