import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Customer, CustomerUpdatePayload } from '@/types/customer'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGION_CODES = ['SE', 'FI', 'NO', 'EE', 'LV', 'LT', 'PL'] as const
const NONE = 'none'

type FormState = {
  first_name: string
  last_name: string
  email: string
  alternative_email: string
  tel: string
  alternative_tel: string
  careof: string
  adress: string
  post_nr: string
  ort: string
  region_code: string
  sex: string
  pers_nr: string
}

function toFormState(c: Customer): FormState {
  return {
    first_name: c.first_name ?? '',
    last_name: c.last_name ?? '',
    email: c.email ?? '',
    alternative_email: c.alternative_email ?? '',
    tel: c.tel ?? '',
    alternative_tel: c.alternative_tel ?? '',
    careof: c.careof ?? '',
    adress: c.adress ?? '',
    post_nr: c.post_nr ?? '',
    ort: c.ort ?? '',
    region_code: c.region_code ?? NONE,
    sex: c.sex ?? NONE,
    pers_nr: c.pers_nr ?? '',
  }
}

function toPayload(f: FormState): CustomerUpdatePayload {
  return {
    first_name: f.first_name.trim() || null,
    last_name: f.last_name.trim() || null,
    email: f.email.trim() || null,
    alternative_email: f.alternative_email.trim() || null,
    tel: f.tel.trim() || null,
    alternative_tel: f.alternative_tel.trim() || null,
    careof: f.careof.trim() || null,
    adress: f.adress.trim() || null,
    post_nr: f.post_nr.trim() || null,
    ort: f.ort.trim() || null,
    region_code: f.region_code === NONE ? null : f.region_code,
    sex: f.sex === NONE ? null : f.sex,
    pers_nr: f.pers_nr.trim() || null,
  }
}

function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {}
  if (f.first_name.length > 64) e.first_name = 'Max 64 characters.'
  if (f.last_name.length > 64) e.last_name = 'Max 64 characters.'
  if (f.email && !EMAIL_RE.test(f.email)) e.email = 'Invalid email address.'
  if (f.email.length > 64) e.email = 'Max 64 characters.'
  if (f.alternative_email && !EMAIL_RE.test(f.alternative_email)) e.alternative_email = 'Invalid email address.'
  if (f.alternative_email.length > 64) e.alternative_email = 'Max 64 characters.'
  if (f.tel.length > 20) e.tel = 'Max 20 characters.'
  if (f.alternative_tel.length > 20) e.alternative_tel = 'Max 20 characters.'
  if (f.careof.length > 100) e.careof = 'Max 100 characters.'
  if (f.adress.length > 256) e.adress = 'Max 256 characters.'
  if (f.post_nr.length > 11) e.post_nr = 'Max 11 characters.'
  if (f.ort.length > 64) e.ort = 'Max 64 characters.'
  if (f.pers_nr.length > 40) e.pers_nr = 'Max 40 characters.'
  return e
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface CustomerEditFormProps {
  customer: Customer
  saving: boolean
  error: string | null
  fieldErrors: Record<string, string>
  onSubmit: (payload: CustomerUpdatePayload) => void
  onCancel: () => void
}

export function CustomerEditForm({
  customer,
  saving,
  error,
  fieldErrors,
  onSubmit,
  onCancel,
}: CustomerEditFormProps) {
  const initial = useMemo(() => toFormState(customer), [customer])
  const [form, setForm] = useState<FormState>(initial)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const isDirty = (Object.keys(initial) as (keyof FormState)[]).some(
    (k) => form[k] !== initial[k]
  )

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setClientErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const errors = { ...clientErrors, ...fieldErrors }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs)
      return
    }
    onSubmit(toPayload(form))
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white divide-y">
      <div className="p-6">
        <FormSection title="Name">
          <FormField label="First name" error={errors.first_name}>
            <Input
              value={form.first_name}
              onChange={(e) => setField('first_name', e.target.value)}
              disabled={saving}
              placeholder="First name"
            />
          </FormField>
          <FormField label="Last name" error={errors.last_name}>
            <Input
              value={form.last_name}
              onChange={(e) => setField('last_name', e.target.value)}
              disabled={saving}
              placeholder="Last name"
            />
          </FormField>
        </FormSection>
      </div>

      <div className="p-6">
        <FormSection title="Emails">
          <FormField label="Email" error={errors.email}>
            <Input
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={saving}
              placeholder="email@example.com"
            />
          </FormField>
          <FormField label="Alternative email" error={errors.alternative_email}>
            <Input
              value={form.alternative_email}
              onChange={(e) => setField('alternative_email', e.target.value)}
              disabled={saving}
              placeholder="email@example.com"
            />
          </FormField>
        </FormSection>
      </div>

      <div className="p-6">
        <FormSection title="Phones">
          <FormField label="Phone" error={errors.tel}>
            <Input
              value={form.tel}
              onChange={(e) => setField('tel', e.target.value)}
              disabled={saving}
              placeholder="Phone number"
            />
          </FormField>
          <FormField label="Alternative phone" error={errors.alternative_tel}>
            <Input
              value={form.alternative_tel}
              onChange={(e) => setField('alternative_tel', e.target.value)}
              disabled={saving}
              placeholder="Phone number"
            />
          </FormField>
        </FormSection>
      </div>

      <div className="p-6">
        <FormSection title="Address">
          <FormField label="Care of" error={errors.careof}>
            <Input
              value={form.careof}
              onChange={(e) => setField('careof', e.target.value)}
              disabled={saving}
              placeholder="c/o"
            />
          </FormField>
          <FormField label="Address" error={errors.adress}>
            <Input
              value={form.adress}
              onChange={(e) => setField('adress', e.target.value)}
              disabled={saving}
              placeholder="Street address"
            />
          </FormField>
          <FormField label="Postal code" error={errors.post_nr}>
            <Input
              value={form.post_nr}
              onChange={(e) => setField('post_nr', e.target.value)}
              disabled={saving}
              placeholder="Postal code"
            />
          </FormField>
          <FormField label="City" error={errors.ort}>
            <Input
              value={form.ort}
              onChange={(e) => setField('ort', e.target.value)}
              disabled={saving}
              placeholder="City"
            />
          </FormField>
          <FormField label="Region" error={errors.region_code}>
            <Select
              value={form.region_code}
              onValueChange={(v) => setField('region_code', v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="— none —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— none —</SelectItem>
                {REGION_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>
      </div>

      <div className="p-6">
        <FormSection title="Identity">
          <FormField label="Gender" error={errors.sex}>
            <Select
              value={form.sex}
              onValueChange={(v) => setField('sex', v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="— none —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— none —</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Personal no." error={errors.pers_nr}>
            <Input
              value={form.pers_nr}
              onChange={(e) => setField('pers_nr', e.target.value)}
              disabled={saving}
              placeholder="SSN"
            />
          </FormField>
        </FormSection>
      </div>

      <div className="p-6 flex items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}
