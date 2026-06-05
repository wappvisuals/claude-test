import { useEffect, useState, useCallback } from 'react'
import {
  ShieldHalf, UserPlus, Pencil, Trash2, Power, AlertTriangle,
  Bell, Activity, CheckCircle2, XCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useSinfridAccount } from '@/hooks/useSinfridAccount'
import {
  fetchSinfridAlarms, fetchSinfridActivities, setSinfridStatus,
  deleteSinfridAccount, removeSinfridFamilyMember,
} from '@/lib/api'
import type { SinfridAlarm, SinfridActivity, SinfridMember } from '@/types/sinfrid'
import { SinfridFamilyMemberDialog } from './SinfridFamilyMemberDialog'
import { SinfridPlanChangeDialog } from './SinfridPlanChangeDialog'

type Confirm =
  | { kind: 'status'; activate: boolean }
  | { kind: 'delete' }
  | { kind: 'removeMember'; member: SinfridMember }

function severityTone(sev: string | null): string {
  const s = (sev ?? '').toLowerCase()
  if (s === 'high' || s === 'critical') return 'bg-red-100 text-red-700'
  if (s === 'medium') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-600'
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-[13px] font-medium text-[#1A1A2E]">{value ?? <span className="text-gray-300">—</span>}</p>
    </div>
  )
}

export function SinfridAccountCard({ customerId }: { customerId: number }) {
  const { account, loading, notFound, error, refetch } = useSinfridAccount(customerId)
  const [alarms, setAlarms] = useState<SinfridAlarm[]>([])
  const [activities, setActivities] = useState<SinfridActivity[]>([])
  const [planOpen, setPlanOpen] = useState(false)
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; member: SinfridMember | null }>({ open: false, member: null })
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const loadExtras = useCallback(() => {
    fetchSinfridAlarms(customerId).then((r) => setAlarms(r.data)).catch(() => setAlarms([]))
    fetchSinfridActivities(customerId).then(setActivities).catch(() => setActivities([]))
  }, [customerId])

  useEffect(() => {
    if (account) loadExtras()
  }, [account, loadExtras])

  function refreshAll() {
    refetch()
    loadExtras()
  }

  async function runConfirm() {
    if (!confirm || !account) return
    if (confirm.kind === 'status') await setSinfridStatus(account.id, confirm.activate ? 'activate' : 'deactivate')
    else if (confirm.kind === 'delete') await deleteSinfridAccount(account.id)
    else await removeSinfridFamilyMember(account.id, confirm.member.id)
    refreshAll()
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
        <div className="mb-2 flex items-center gap-2">
          <ShieldHalf size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Sinfrid Account</h2>
        </div>
        <p className="py-6 text-center text-sm text-gray-400">This customer has no Sinfrid account.</p>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
        <p className="text-sm text-red-500">{error ?? 'Failed to load Sinfrid account.'}</p>
      </div>
    )
  }

  const confirmProps = confirm && (() => {
    if (confirm.kind === 'status') return {
      title: confirm.activate ? 'Activate account?' : 'Deactivate account?',
      description: confirm.activate
        ? 'The account and its family members will be reactivated.'
        : 'The account and its family members will be deactivated.',
      confirmLabel: confirm.activate ? 'Activate' : 'Deactivate',
      destructive: !confirm.activate,
    }
    if (confirm.kind === 'delete') return {
      title: 'Delete Sinfrid account?',
      description: 'This removes the account and all its family members.',
      confirmLabel: 'Delete', destructive: true,
    }
    return {
      title: 'Remove family member?',
      description: <>Remove <span className="font-medium">{confirm.member.full_name || confirm.member.ssn}</span> from this account.</>,
      confirmLabel: 'Remove', destructive: true,
    }
  })()

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldHalf size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Sinfrid Account</h2>
          {account.is_active ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
              <CheckCircle2 size={11} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              <XCircle size={11} /> Deactivated
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setConfirm({ kind: 'status', activate: account.is_deactivated })}>
            <Power size={14} /> {account.is_deactivated ? 'Activate' : 'Deactivate'}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm({ kind: 'delete' })}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Details + plan */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-4">
        <Stat label="Name" value={[account.first_name, account.last_name].filter(Boolean).join(' ') || null} />
        <Stat label="Email" value={account.email} />
        <Stat label="Phone" value={account.phone} />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Plan</p>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-[#1A1A2E]">{account.plan_name || '—'}</p>
            <button onClick={() => setPlanOpen(true)} className="text-[11px] font-medium text-[#00C48C] hover:underline">
              Change
            </button>
          </div>
        </div>
        <Stat label="Type" value={account.type} />
        <Stat label="Activation" value={account.activation_date} />
        <Stat label="Last login" value={account.last_login_at} />
        <Stat label="Confirmed" value={`${account.email_confirmed ? 'Email' : ''}${account.email_confirmed && account.phone_confirmed ? ' · ' : ''}${account.phone_confirmed ? 'Phone' : ''}` || 'No'} />
      </div>

      {/* Family members */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Family members ({account.family_members.length})</h3>
          <Button size="sm" variant="outline" onClick={() => setMemberDialog({ open: true, member: null })}>
            <UserPlus size={14} /> Add
          </Button>
        </div>
        {account.family_members.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No family members.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {account.family_members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.full_name || '—'}</p>
                  <p className="text-xs text-gray-400">{m.ssn || '—'}{m.email ? ` · ${m.email}` : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  {m.is_deactivated && <span className="mr-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">inactive</span>}
                  <button onClick={() => setMemberDialog({ open: true, member: m })} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirm({ kind: 'removeMember', member: m })} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alarms + Activities */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Bell size={13} /> Alarms ({alarms.length})
          </h3>
          {alarms.length === 0 ? (
            <p className="text-sm text-gray-400">No alarms.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {alarms.map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-gray-800">{a.text || a.category || 'Alarm'}</p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${severityTone(a.severity)}`}>
                        {a.severity || '—'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{a.category || ''}{a.date ? ` · ${a.date}` : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Activity size={13} /> Activity
          </h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activity.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {activities.map((act, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span className="text-gray-700">{act.label}</span>
                  <span className="text-xs text-gray-400">{act.date ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SinfridPlanChangeDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        accountId={account.id}
        currentPlanId={account.plan_id}
        onChanged={refreshAll}
      />
      <SinfridFamilyMemberDialog
        open={memberDialog.open}
        onOpenChange={(o) => setMemberDialog((s) => ({ ...s, open: o }))}
        accountId={account.id}
        member={memberDialog.member}
        onSaved={refreshAll}
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
