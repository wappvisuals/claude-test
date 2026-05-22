import { useNavigate } from 'react-router-dom'
import {
  Mail, Phone, MapPin, User, Calendar, CreditCard, Truck, Users,
  Copy, CheckCircle2, Circle, ChevronLeft, Pencil, Building2,
} from 'lucide-react'
import type { Customer } from '@/types/customer'

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

function formatBirthdate(raw: string | null): string | null {
  if (!raw) return null
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return raw
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${MONTHS[month - 1]} ${day}${ordinalSuffix(day)}, ${year}`
}

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

interface Props {
  customer: Customer
  onEdit: () => void
}

export function CustomerProfileSidebar({ customer, onEdit }: Props) {
  const navigate = useNavigate()
  const ledgers = Array.isArray(customer.ledgers) ? (customer.ledgers as Record<string, unknown>[]) : []
  const hasAddress = customer.adress || customer.post_nr || customer.ort

  function copyAddress() {
    const addr = [customer.adress, customer.post_nr, customer.ort].filter(Boolean).join(', ')
    navigator.clipboard.writeText(addr)
  }

  return (
    <div className="w-[300px] flex-shrink-0 bg-white border-r border-[#EBEBF5] flex flex-col overflow-y-auto">

      {/* ── Name + phone + stats ── */}
      <div className="px-5 pt-5 pb-4 border-b border-[#EBEBF5]">
        <h2 className="text-[18px] font-bold text-[#1A1A2E] leading-tight">{customer.full_name}</h2>
        {customer.tel && (
          <p className="text-[13px] text-gray-500 mt-0.5">{customer.tel}</p>
        )}

        <div className="mt-4 flex divide-x divide-[#EBEBF5] border border-[#EBEBF5] rounded-xl overflow-hidden">
          <div className="flex-1 px-2 py-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">LTV</p>
            <p className="text-[13px] font-bold text-[#1A1A2E] mt-0.5">—</p>
          </div>
          <div className="flex-1 px-2 py-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">ORDERS</p>
            <p className="text-[13px] font-bold text-[#1A1A2E] mt-0.5">{ledgers.length || '—'}</p>
          </div>
          <div className="flex-1 px-2 py-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">LAST ORDER</p>
            <p className="text-[13px] font-bold text-[#1A1A2E] mt-0.5 truncate">{customer.last_order ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Nav controls ── */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#EBEBF5]">
        <button
          onClick={() => navigate('/customers')}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <Pencil size={13} />
        </button>
      </div>

      {/* ── Contact details ── */}
      <div className="px-5 py-1 border-b border-[#EBEBF5] divide-y divide-[#F5F6FA]">

        {/* Email(s) */}
        <Row icon={Mail}>
          {customer.email || customer.alternative_email ? (
            <div className="flex flex-col gap-0.5">
              {customer.email && (
                <span className="text-[13px] text-[#00C48C] truncate">{customer.email}</span>
              )}
              {customer.alternative_email && (
                <span className="text-[13px] text-[#00C48C] truncate">{customer.alternative_email}</span>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-gray-300">—</span>
          )}
        </Row>

        {/* Phone */}
        <Row icon={Phone}>
          {customer.tel ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#1A1A2E]">{customer.tel}</span>
              {customer.alternative_tel && (
                <span className="text-[13px] text-gray-500">{customer.alternative_tel}</span>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-gray-300">—</span>
          )}
        </Row>

        {/* Region */}
        <Row icon={MapPin}>
          <span className={`text-[13px] ${customer.region_code ? 'text-[#1A1A2E]' : 'text-gray-300'}`}>
            {customer.region_code ?? '—'}
          </span>
        </Row>

        {/* Gender */}
        <Row icon={User}>
          <span className={`text-[13px] capitalize ${customer.sex ? 'text-[#1A1A2E]' : 'text-gray-300'}`}>
            {customer.sex ?? '—'}
          </span>
        </Row>

        {/* Birthdate */}
        <Row icon={Calendar}>
          <span className={`text-[13px] ${customer.birthdate ? 'text-[#1A1A2E]' : 'text-gray-300'}`}>
            {formatBirthdate(customer.birthdate) ?? '—'}
          </span>
        </Row>

        {/* Payment preference */}
        <Row icon={CreditCard}>
          <span className="text-[13px] text-gray-400 italic">No payment preference</span>
        </Row>

        {/* Delivery / sync */}
        <Row icon={Truck}>
          {customer.sync ? (
            <span className="text-[13px] font-semibold text-[#00C48C]">{customer.sync}</span>
          ) : (
            <span className="text-[13px] text-gray-300">—</span>
          )}
        </Row>

        {/* Care of */}
        <Row icon={Users}>
          <span className={`text-[13px] ${customer.careof ? 'text-[#1A1A2E]' : 'text-gray-400 italic'}`}>
            {customer.careof ?? 'No careof'}
          </span>
        </Row>

        {/* Organization */}
        {customer.organization_id != null && (
          <Row icon={Building2}>
            <span className="text-[13px] text-[#1A1A2E]">{customer.organization_id}</span>
          </Row>
        )}
      </div>

      {/* ── Address ── */}
      {hasAddress && (
        <div className="px-5 py-4 border-b border-[#EBEBF5]">
          <p className="text-[11px] font-semibold text-[#1A1A2E] uppercase tracking-wide mb-3">Address</p>

          <div className="flex items-start gap-3">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#1A1A2E] leading-relaxed">
                {customer.adress && <>{customer.adress}<br /></>}
                {customer.post_nr && <>{customer.post_nr}<br /></>}
                {customer.ort && <>{customer.ort}</>}
              </p>
            </div>
            <button
              onClick={copyAddress}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-400 flex-shrink-0"
              title="Copy address"
            >
              <Copy size={12} />
            </button>
          </div>

          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              {customer.sync
                ? <CheckCircle2 size={15} className="text-[#00C48C]" />
                : <Circle size={15} className="text-gray-300" />
              }
              <span className="text-[12px] text-gray-500">Address Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              {customer.credit_check
                ? <CheckCircle2 size={15} className="text-[#00C48C]" />
                : <Circle size={15} className="text-gray-300" />
              }
              <span className="text-[12px] text-gray-500">Credit Check</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Commitment ── */}
      {ledgers.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold text-[#1A1A2E] uppercase tracking-wide mb-3">Commitment</p>
          <div className="flex flex-col">
            {ledgers.map((ledger, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#F5F6FA] last:border-0">
                <span className="text-[13px] text-gray-600 truncate flex-1 mr-2">
                  {String(ledger.name ?? ledger.product_name ?? ledger.description ?? `Item ${i + 1}`)}
                </span>
                <span className="text-[12px] text-gray-400 flex-shrink-0 font-medium">
                  {String(ledger.paid ?? ledger.paid_count ?? 0)}/{String(ledger.total ?? ledger.total_count ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
