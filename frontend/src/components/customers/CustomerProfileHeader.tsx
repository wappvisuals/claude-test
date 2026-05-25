import { useState } from 'react'
import {
  Mail, Phone, MapPin, User, Calendar, CreditCard, Truck, Users,
  Copy, Check, Pencil, Building2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useOrganizationUpsert } from '@/hooks/useOrganizationUpsert'
import { CustomerOrganizationForm } from './CustomerOrganizationForm'
import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
  onOrgSave: (updated: Customer) => void
  onEdit: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (!raw?.trim()) return null

  const digits = raw.replace(/\D/g, '')
  let year: number, month: number, day: number

  if (digits.length === 6) {
    // YYMMDD — Swedish short format (e.g. "811020")
    const yy = Number(digits.slice(0, 2))
    year  = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy
    month = Number(digits.slice(2, 4))
    day   = Number(digits.slice(4, 6))
  } else if (digits.length === 8) {
    // YYYYMMDD
    year  = Number(digits.slice(0, 4))
    month = Number(digits.slice(4, 6))
    day   = Number(digits.slice(6, 8))
  } else {
    // Try ISO YYYY-MM-DD
    const parts = raw.split('-').map(Number)
    if (parts.length < 3) return raw
    ;[year, month, day] = parts
  }

  if (!year || !month || !day || month > 12 || day > 31) return raw

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${MONTHS[month - 1]} ${day}${ordinalSuffix(day)}, ${year}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ['from-teal-400', 'to-emerald-500'],
  ['from-violet-400', 'to-purple-500'],
  ['from-orange-400', 'to-amber-500'],
  ['from-blue-400', 'to-indigo-500'],
  ['from-rose-400', 'to-pink-500'],
]

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const [from, to] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className={`bg-gradient-to-br ${from} ${to} rounded-full flex items-center justify-center text-white font-semibold select-none flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}


function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 leading-none mb-0.5 uppercase tracking-wide">{label}</p>
        <p className="text-[13px] font-medium leading-snug text-[#1A1A2E]">{value}</p>
      </div>
    </div>
  )
}

function OrgCard({ customer, onOrgSave }: { customer: Customer; onOrgSave: (updated: Customer) => void }) {
  const [editing, setEditing] = useState(false)
  const { upsert, saving, error, fieldErrors } = useOrganizationUpsert()

  async function handleSubmit(orgId: string, name: string | undefined) {
    const updated = await upsert(customer.id, { organization_id: orgId, name })
    if (updated) {
      onOrgSave(updated)
      setEditing(false)
    }
  }

  return (
    <div className="border border-[#EBEBF5] rounded-xl px-4 py-3">
      {editing ? (
        /* ── Edit mode: no "Organization" label stacked above form ── */
        <>
          <p className="text-[11px] text-gray-400 mb-3">
            {customer.organization_id ? 'Change Organization' : 'Link Organization'}
          </p>
          <CustomerOrganizationForm
            customerId={customer.id}
            initialOrgId={customer.organization_id?.toString() ?? ''}
            saving={saving}
            error={error}
            fieldErrors={fieldErrors}
            onSuccess={onOrgSave}
            onCancel={() => setEditing(false)}
            onSubmit={handleSubmit}
          />
        </>
      ) : (
        /* ── View mode ── */
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-gray-400">Organization</p>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#00C48C] hover:text-[#00A876] transition-colors"
            >
              <Pencil size={11} />
              {customer.organization_id ? 'Edit' : 'Link'}
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={14} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              {customer.organization_id ? (
                <>
                  <p className="text-[13px] font-semibold text-[#1A1A2E] leading-tight truncate">{customer.organization_id}</p>
                  {customer.organization_name && (
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">{customer.organization_name}</p>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-gray-400 italic">— none —</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomerProfileHeader({ customer, onOrgSave, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const addressLine = [customer.adress, customer.post_nr, customer.ort].filter(Boolean).join(', ')

  function copyAddress() {
    navigator.clipboard.writeText(addressLine)
    setAddressCopied(true)
    setTimeout(() => setAddressCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-[#EBEBF5] rounded-xl px-6 py-5">

      {/* Name + edit button */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#1A1A2E] leading-tight">{customer.full_name}</h1>
          {customer.pers_nr && (
            <span className="inline-block mt-1.5 text-[11px] text-gray-500 bg-gray-100 rounded px-2 py-0.5 font-mono tracking-wide">
              {customer.pers_nr}
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-[#EBEBF5] rounded-lg px-3 py-1.5 hover:border-[#00C48C] hover:text-[#00C48C] transition-colors flex-shrink-0"
        >
          <Pencil size={12} />
          Edit details
        </button>
      </div>

      {/* Detail fields grid — 3 detail cols + 1 org col */}
      <div className="grid grid-cols-4 gap-x-8 gap-y-7">

        {/* OrgCard — pinned to col 4, spans 3 rows */}
        <div className="col-start-4 row-start-1 row-span-3">
          <OrgCard customer={customer} onOrgSave={onOrgSave} />
        </div>

        {/* Email — always visible */}
        <div className="flex items-start gap-2.5">
          <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
            {customer.email || customer.alternative_email ? (
              <div className="flex flex-col gap-0.5">
                {customer.email && <p className="text-[13px] font-medium text-[#00C48C] truncate">{customer.email}</p>}
                {customer.alternative_email && <p className="text-[11px] text-[#00C48C]/60 truncate">{customer.alternative_email}</p>}
              </div>
            ) : (
              <p className="text-[13px] text-gray-300">—</p>
            )}
          </div>
        </div>

        {/* Phone — always visible */}
        <div className="flex items-start gap-2.5">
          <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
            {customer.tel || customer.alternative_tel ? (
              <div className="flex flex-col gap-0.5">
                {customer.tel && <p className="text-[13px] font-medium text-[#1A1A2E]">{customer.tel}</p>}
                {customer.alternative_tel && <p className="text-[11px] text-gray-400 truncate">{customer.alternative_tel}</p>}
              </div>
            ) : (
              <p className="text-[13px] text-gray-300">—</p>
            )}
          </div>
        </div>

        {/* Address — always visible */}
        <div className="flex items-start gap-2.5">
          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
            {addressLine ? (
              <div className="flex items-start gap-2">
                <p className="text-[13px] font-medium text-[#1A1A2E] leading-snug">
                  {customer.adress && <>{customer.adress}<br /></>}
                  {[customer.post_nr, customer.ort].filter(Boolean).join(' ')}
                </p>
                <button
                  onClick={copyAddress}
                  className={`w-5 h-5 flex items-center justify-center rounded transition-colors flex-shrink-0 mt-0.5 ${
                    addressCopied ? 'text-[#00C48C]' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={addressCopied ? 'Copied!' : 'Copy address'}
                >
                  {addressCopied ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-gray-300">—</p>
            )}
          </div>
        </div>

        {/* Extra details — only when expanded */}
        {expanded && (
          <>
            <DetailItem icon={User}       label="Gender"    value={customer.sex ? <span className="capitalize">{customer.sex}</span> : <span className="text-gray-300">—</span>} />
            <DetailItem icon={Calendar}   label="Birthdate" value={formatBirthdate(customer.birthdate) ?? <span className="text-gray-300">—</span>} />
            <DetailItem icon={MapPin}     label="Region"    value={customer.region_code ?? <span className="text-gray-300">—</span>} />
            <DetailItem icon={CreditCard} label="Payment"   value={<span className="text-gray-400 italic font-normal">No payment preference</span>} />
            <DetailItem icon={Truck}      label="Delivery"  value={customer.sync ? <span className="text-[#00C48C] font-semibold">{customer.sync}</span> : <span className="text-gray-300">—</span>} />
            <DetailItem icon={Users}      label="Care of"   value={customer.careof ?? <span className="text-gray-400 italic font-normal">No careof</span>} />
          </>
        )}

      </div>

      {/* Expand / collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-5 flex items-center gap-1 text-[12px] text-gray-400 hover:text-[#00C48C] transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Show less' : 'Show more details'}
      </button>

    </div>
  )
}
