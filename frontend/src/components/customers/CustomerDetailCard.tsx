import type { Customer } from '@/types/customer'

interface CustomerDetailCardProps {
  customer: Customer
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </div>
  )
}

export function CustomerDetailCard({ customer }: CustomerDetailCardProps) {
  return (
    <div className="rounded-lg border bg-white divide-y">
      <div className="p-6">
        <Section title="Contact">
          <Field label="Email"             value={customer.email} />
          <Field label="Alternative email" value={customer.alternative_email} />
          <Field label="Phone"             value={customer.tel} />
          <Field label="Alternative phone" value={customer.alternative_tel} />
          <Field label="Do not call"       value={customer.do_not_call ? 'Yes' : customer.do_not_call === false ? 'No' : null} />
          <Field label="Difficult customer" value={customer.difficult_customer ? 'Yes' : customer.difficult_customer === false ? 'No' : null} />
        </Section>
      </div>

      <div className="p-6">
        <Section title="Address">
          <Field label="Care of"     value={customer.careof} />
          <Field label="Address"     value={customer.adress} />
          <Field label="Postal code" value={customer.post_nr} />
          <Field label="City"        value={customer.ort} />
          <Field label="Region"      value={customer.region_code} />
        </Section>
      </div>

      <div className="p-6">
        <Section title="Details">
          <Field label="Personal no."   value={customer.pers_nr} />
          <Field label="Sex"            value={customer.sex} />
          <Field label="Date of birth"  value={customer.birthdate} />
          <Field label="Language"       value={customer.language} />
          <Field label="Newsletter"     value={customer.want_newsletter ? 'Yes' : customer.want_newsletter === false ? 'No' : null} />
          <Field label="Organisation"   value={customer.organization_id} />
          <Field label="First visit"    value={customer.first_visit} />
          <Field label="Last updated"   value={customer.updated_at} />
        </Section>
      </div>
    </div>
  )
}
