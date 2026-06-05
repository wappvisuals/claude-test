import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ListView, ListViewHeader, ListViewToolbar, ListTable, ListThead, ListTh,
  ListRow, ListCell, ListEmpty, ListFooter,
} from '@/components/ui/ListView'
import { useGdprCustomers } from '@/hooks/useGdprCustomers'
import { useGdprActions } from '@/hooks/useGdprActions'
import { GdprStatusBadge } from './GdprStatusBadge'
import { GdprBulkActionBar } from './GdprBulkActionBar'
import { GdprFlagDialog } from './GdprFlagDialog'
import type { GdprBulkAction, GdprCustomer, GdprExclusionType, GdprStatus } from '@/types/gdpr'

const PER_PAGE = 25

const TABS: { key: 'all' | GdprStatus; label: string }[] = [
  { key: 'all',            label: 'All statuses' },
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
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [flagFor, setFlagFor] = useState<GdprCustomer | null>(null)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)

  const status = tab === 'all' ? undefined : [tab]
  const { data, loading, error, refetch } = useGdprCustomers({ q: query || undefined, status, page, per_page: PER_PAGE })
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

  function handleSearch(q: string) {
    setQuery(q.trim())
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

      {error && <p className="text-sm text-red-500">{error}</p>}
      {actions.error && <p className="text-sm text-red-500">{actions.error}</p>}

      <GdprBulkActionBar
        count={selected.size}
        disabled={actions.submitting}
        onAction={requestBulk}
        onClear={() => setSelected(new Set())}
      />

      <ListView>
        <ListViewHeader title="GDPR Records" icon={<ShieldCheck size={15} />} count={data?.meta.total} />

        <ListViewToolbar>
          <SearchBar onSearch={handleSearch} placeholder="Search by name or customer ID…" />
          <Select value={tab} onValueChange={(v) => changeTab(v as 'all' | GdprStatus)}>
            <SelectTrigger className="ml-auto w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABS.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListViewToolbar>

        <ListTable>
          <ListThead>
            <ListTh className="w-10">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </ListTh>
            <ListTh>Customer</ListTh>
            <ListTh className="w-36">Status</ListTh>
            <ListTh className="w-48">Exclusion type</ListTh>
            <ListTh className="w-28">Flagged</ListTh>
            <ListTh className="w-32">Requested by</ListTh>
            <ListTh className="w-56 text-right">Actions</ListTh>
          </ListThead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ListRow key={i}><ListCell colSpan={7}><Skeleton className="h-5 w-full" /></ListCell></ListRow>
              ))
            ) : rows.length === 0 ? (
              <ListEmpty colSpan={7} message="No GDPR records found." />
            ) : (
              rows.map((row) => (
                <ListRow key={row.id} selected={selected.has(row.customer_id)}>
                  <ListCell>
                    <Checkbox
                      checked={selected.has(row.customer_id)}
                      onCheckedChange={() => toggleRow(row.customer_id)}
                      aria-label={`Select ${row.customer_name}`}
                    />
                  </ListCell>
                  <ListCell>
                    <Link to={`/customers/${row.customer_id}`} className="font-medium text-[#1A1A2E] hover:text-[#00C48C] hover:underline">
                      {row.customer_name || `#${row.customer_id}`}
                    </Link>
                  </ListCell>
                  <ListCell><GdprStatusBadge status={row.status} label={row.status_label} /></ListCell>
                  <ListCell className="text-gray-600">
                    {row.exclusion_type
                      ? <span title={row.exclusion_description ?? undefined}>{row.exclusion_type}</span>
                      : <span className="text-gray-300">—</span>}
                  </ListCell>
                  <ListCell className="text-gray-500">{formatDate(row.flagged_at)}</ListCell>
                  <ListCell className="text-gray-600">{row.requested_by?.username || 'System'}</ListCell>
                  <ListCell>
                    <div className="flex items-center justify-end gap-1.5">{rowActions(row)}</div>
                  </ListCell>
                </ListRow>
              ))
            )}
          </tbody>
        </ListTable>

        {data && (
          <ListFooter
            from={data.meta.from}
            to={data.meta.to}
            total={data.meta.total}
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            noun="records"
            onPageChange={setPage}
          />
        )}
      </ListView>

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
