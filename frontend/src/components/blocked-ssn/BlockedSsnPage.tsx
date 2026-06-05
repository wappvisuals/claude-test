import { useState } from 'react'
import { Plus, Trash2, ShieldBan } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/ui/SearchBar'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ListView, ListViewHeader, ListViewToolbar, ListTable, ListThead, ListTh,
  ListRow, ListCell, ListEmpty, ListFooter,
} from '@/components/ui/ListView'
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
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BlockedSsn | null>(null)

  const { data, loading, error, refetch } = useBlockedSsns({ q: query || undefined, page, per_page: PER_PAGE })
  const actions = useBlockedSsnActions()

  function handleSearch(q: string) {
    setQuery(q.trim())
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
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShieldBan size={24} className="text-gray-700" />
          Blocked SSNs
        </h1>
        <p className="mt-1 text-sm text-gray-500">SSNs blocked from placing any orders.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ListView>
        <ListViewHeader title="Blocked SSNs" icon={<ShieldBan size={15} />} count={data?.meta.total}>
          <Button size="sm" onClick={() => { actions.clearError(); setAddOpen(true) }}>
            <Plus size={15} /> Block SSN
          </Button>
        </ListViewHeader>

        <ListViewToolbar>
          <SearchBar onSearch={handleSearch} placeholder="Search SSN or reason…" />
        </ListViewToolbar>

        <ListTable>
          <ListThead>
            <ListTh className="w-48">SSN</ListTh>
            <ListTh>Reason</ListTh>
            <ListTh className="w-36">Added by</ListTh>
            <ListTh className="w-44">Date</ListTh>
            <ListTh className="w-16 text-right">Action</ListTh>
          </ListThead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ListRow key={i}><ListCell colSpan={5}><Skeleton className="h-5 w-full" /></ListCell></ListRow>
              ))
            ) : rows.length === 0 ? (
              <ListEmpty colSpan={5} message="No blocked SSNs found." />
            ) : (
              rows.map((row) => (
                <ListRow key={row.id}>
                  <ListCell className="font-mono">{row.ssn}</ListCell>
                  <ListCell className="text-gray-600">{row.reason || <span className="text-gray-300">—</span>}</ListCell>
                  <ListCell className="text-gray-600">{row.added_by?.username || 'System'}</ListCell>
                  <ListCell className="text-gray-500">{formatDate(row.created_at)}</ListCell>
                  <ListCell className="text-right">
                    <button
                      type="button"
                      onClick={() => { actions.clearError(); setToDelete(row) }}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove block for ${row.ssn}`}
                    >
                      <Trash2 size={16} />
                    </button>
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
            noun="blocked SSNs"
            onPageChange={setPage}
          />
        )}
      </ListView>

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
