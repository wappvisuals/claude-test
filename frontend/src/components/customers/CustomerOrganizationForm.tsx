import { useState } from 'react'
import { Search } from 'lucide-react'
import { searchOrganizations } from '@/lib/api'
import { getErrorMessage } from '@/lib/api'
import type { Organization } from '@/types/organization'
import type { Customer } from '@/types/customer'

interface Props {
  customerId: number
  initialOrgId: string
  saving: boolean
  error: string | null
  fieldErrors: Record<string, string>
  onSuccess: (customer: Customer) => void
  onCancel: () => void
  onSubmit: (orgId: string, name: string | undefined) => Promise<void>
}

export function CustomerOrganizationForm({
  customerId: _customerId,
  initialOrgId,
  saving,
  error,
  fieldErrors,
  onSuccess: _onSuccess,
  onCancel,
  onSubmit,
}: Props) {
  const [orgId, setOrgId] = useState(initialOrgId)
  const [orgName, setOrgName] = useState('')
  const [searched, setSearched] = useState(false)
  const [foundOrg, setFoundOrg] = useState<Organization | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  async function handleSearch() {
    const trimmedId = orgId.trim()
    if (!trimmedId) {
      setClientErrors({ organization_id: 'Organization ID is required.' })
      return
    }
    setClientErrors({})
    setSearching(true)
    setSearchError(null)
    try {
      const res = await searchOrganizations(trimmedId)
      const exact = res.data.find(o => o.id === trimmedId) ?? null
      setFoundOrg(exact)
      setOrgName(exact ? exact.name : '')
      setSearched(true)
    } catch (err) {
      setSearchError(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    const trimmedId = orgId.trim()
    if (!trimmedId) errs.organization_id = 'Organization ID is required.'
    else if (trimmedId.length > 10) errs.organization_id = 'Max 10 characters.'
    else if (!/^[a-zA-Z0-9]+$/.test(trimmedId)) errs.organization_id = 'Alphanumeric only.'
    if (!searched) errs.organization_id = errs.organization_id ?? 'Click Search before saving.'
    if (!foundOrg && searched && !orgName.trim()) errs.name = 'Name is required for a new organization.'
    if (orgName.length > 255) errs.name = 'Max 255 characters.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setClientErrors(errs); return }
    setClientErrors({})
    await onSubmit(orgId.trim(), orgName.trim() || undefined)
  }

  const orgIdError = clientErrors.organization_id ?? fieldErrors.organization_id
  const nameError  = clientErrors.name ?? fieldErrors.name

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Org ID + Search */}
      <div>
        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
          Organization ID
        </label>
        <div className="relative">
          <input
            type="text"
            value={orgId}
            onChange={e => { setOrgId(e.target.value); setSearched(false); setFoundOrg(null); setOrgName('') }}
            maxLength={10}
            placeholder="e.g. 5569910127"
            disabled={saving}
            className="w-full text-[13px] border border-[#EBEBF5] rounded-lg pl-3 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C48C]/20 focus:border-[#00C48C] placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={saving || searching}
            title={searching ? 'Searching…' : 'Search'}
            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-[#00C48C] text-white rounded-r-lg hover:bg-[#00A876] transition-colors disabled:opacity-50"
          >
            <Search size={14} />
          </button>
        </div>
        {orgIdError && <p className="text-[11px] text-red-500 mt-1">{orgIdError}</p>}
        {searchError && <p className="text-[11px] text-red-500 mt-1">{searchError}</p>}
        {searched && !searchError && (
          <p className={`text-[11px] mt-1.5 ${foundOrg ? 'text-[#00C48C]' : 'text-orange-500'}`}>
            {foundOrg ? `✓ Found: ${foundOrg.name}` : 'Organization not found — will be created.'}
          </p>
        )}
      </div>

      {/* Org Name */}
      {searched && (
        <div>
          <label className="block text-[12px] font-medium text-[#1A1A2E] mb-1.5">
            Organization name{!foundOrg && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            maxLength={255}
            placeholder="Enter organization name"
            disabled={saving}
            className="w-full text-[13px] border border-[#EBEBF5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C48C]/20 focus:border-[#00C48C] placeholder:text-gray-400 disabled:opacity-50"
          />
          {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || !searched}
          className="px-5 py-1.5 bg-[#00C48C] text-white text-[12px] font-semibold rounded-lg hover:bg-[#00A876] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
