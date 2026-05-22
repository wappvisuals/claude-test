import { useState } from 'react'
import { ChevronUp, ChevronDown, AlertTriangle, Shield } from 'lucide-react'
import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
}

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full leading-none">
              {count}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function FlagRow({ label, danger = false }: { label: string; danger?: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1.5 text-sm ${danger ? 'text-red-600' : 'text-gray-700'}`}>
      <AlertTriangle size={13} className={danger ? 'text-red-500' : 'text-gray-400'} />
      {label}
    </div>
  )
}

function JsonItem({ data }: { data: unknown }) {
  if (typeof data === 'string') {
    return <p className="text-sm text-gray-600 py-1">{data}</p>
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    return (
      <div className="py-2 border-b border-gray-50 last:border-0">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-xs py-0.5">
            <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
            <span className="text-gray-700 font-medium text-right">{String(v ?? '—')}</span>
          </div>
        ))}
      </div>
    )
  }
  return <p className="text-xs text-gray-400 py-1">{String(data)}</p>
}

export function CustomerProfileRelated({ customer }: Props) {
  const flags: string[] = []
  if (customer.do_not_call) flags.push('Do not call')
  if (customer.difficult_customer) flags.push('Difficult customer')

  const ledgers = Array.isArray(customer.ledgers) ? customer.ledgers : []
  const blockedFees = Array.isArray(customer.blocked_fees) ? customer.blocked_fees : []
  const hasReminders = customer.reminders != null
  const hasGothia = customer.gothia_account != null
  const hasAnything = flags.length > 0 || ledgers.length > 0 || blockedFees.length > 0 || hasReminders || hasGothia

  if (!hasAnything) {
    return (
      <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center p-8 text-center">
        <Shield size={28} className="text-gray-200 mb-2" />
        <p className="text-sm text-gray-400">No related data</p>
      </div>
    )
  }

  return (
    <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
      {flags.length > 0 && (
        <Section title="Flags" count={flags.length}>
          {flags.map(f => <FlagRow key={f} label={f} danger />)}
        </Section>
      )}

      {ledgers.length > 0 && (
        <Section title="Ledgers" count={ledgers.length}>
          {ledgers.map((l, i) => <JsonItem key={i} data={l} />)}
        </Section>
      )}

      {blockedFees.length > 0 && (
        <Section title="Blocked fees" count={blockedFees.length}>
          {blockedFees.map((f, i) => <JsonItem key={i} data={f} />)}
        </Section>
      )}

      {hasReminders && (
        <Section title="Reminders">
          {Array.isArray(customer.reminders)
            ? (customer.reminders as unknown[]).map((r, i) => <JsonItem key={i} data={r} />)
            : <JsonItem data={customer.reminders} />
          }
        </Section>
      )}

      {hasGothia && (
        <Section title="Gothia account">
          <JsonItem data={customer.gothia_account} />
        </Section>
      )}
    </div>
  )
}
