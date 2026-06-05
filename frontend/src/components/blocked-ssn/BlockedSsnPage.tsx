import { useState } from 'react'
import { Plus, Search, Trash2, ShieldBan, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useBlockedSsns } from '@/hooks/useBlockedSsns'
import { useBlockedSsnActions } from '@/hooks/useBlockedSsnActions'
import { BlockedSsnAddDialog } from './BlockedSsnAddDialog'
import type { BlockedSsn } from '@/types/blockedSsn'

const PER_PAGE = 25

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

export function BlockedSsnPage() {
  const [rawQuery, setRawQuery] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BlockedSsn | null>(null)

  const query = useDebouncedValue(rawQuery, 300)

  const { data, loading, error, refetch } = useBlockedSsns({ q: query, page, per_page: PER_PAGE })
  const actions = useBlockedSsnActions()

  function handleQueryChange(value: string) {
    setRawQuery(value)
    setPage(1)
  }

  async function handleAdd(payload: Parameters<typeof actions.add>[0]) {
    const ok = await actions.add(payload)
    if (ok) refetch()
    return ok
  }

  async function handleDelete() {
    if (!toDelete) return
    const ok = await actions.remove(toDelete.id)
    if (ok) refetch()
  }

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <ShieldBan size={24} className="text-gray-700" />
            Blocked SSNs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            SSNs blocked from placing any orders.
          </p>
        </div>
        <Button onClick={() => { actions.clearError(); setAddOpen(true) }}>
          <Plus size={16} /> Block SSN
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={rawQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search SSN or reason…"
          className="pl-9"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">SSN</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-36">Added by</TableHead>
              <TableHead className="w-44">Date</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-sm text-gray-400">
                  No blocked SSNs found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.ssn}</TableCell>
                  <TableCell className="text-gray-600">{row.reason || <span className="text-gray-300">—</span>}</TableCell>
                  <TableCell className="text-gray-600">{row.added_by?.username || 'System'}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(row.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => { actions.clearError(); setToDelete(row) }}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove block for ${row.ssn}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">
              {data.meta.from ?? 0}–{data.meta.to ?? 0} of {data.meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={data.meta.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-500">
                {data.meta.current_page} / {data.meta.last_page}
              </span>
              <button
                disabled={data.meta.current_page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BlockedSsnAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        submitting={actions.submitting}
        error={actions.error}
        onSubmit={handleAdd}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove SSN block?"
        description={
          <>
            <span className="font-mono">{toDelete?.ssn}</span> will be able to place orders again.
            This action cannot be undone.
          </>
        }
        confirmLabel="Remove block"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
