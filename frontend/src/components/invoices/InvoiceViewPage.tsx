import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CalendarClock, Link2, Plus, Bell, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoice } from '@/hooks/useInvoice'
import { updateInvoiceDueDate, regenerateInvoicePaymentLink, getErrorMessage } from '@/lib/api'
import { PaymentAddDialog } from '@/components/payments/PaymentAddDialog'

const money = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5 text-[14px] text-[#1A1A2E] break-words">{value ?? <span className="text-gray-300">—</span>}</div>
    </div>
  )
}

export function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const invoiceId = Number(id)
  const { invoice: inv, reminders, payments, loading, error, refetch } = useInvoice(invoiceId)

  const [dueOpen, setDueOpen] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setActionError(null)
    try { await fn(); refetch() } catch (err) { setActionError(getErrorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-[#00C48C]">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText size={22} className="text-gray-700" />
          Invoice {inv ? `#${inv.invoice_id}` : `#${invoiceId}`}
        </h1>
        {inv && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDueDate(inv.due_date ?? ''); setDueOpen(true) }}>
              <CalendarClock size={14} /> Due date
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => run(() => regenerateInvoicePaymentLink(invoiceId))}>
              <Link2 size={14} /> Payment link
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : inv ? (
        <>
          <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
              <Field label="Status" value={<span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold ${inv.status === 'deleted' ? 'bg-gray-100 text-gray-500' : 'bg-[#E8FBF5] text-[#00A876]'}`}>{inv.status ?? '—'}</span>} />
              <Field label="Provider" value={inv.provider} />
              <Field label="Total" value={money(inv.total)} />
              <Field label="Balance" value={money(inv.balance)} />
              <Field label="Date" value={inv.date} />
              <Field label="Due date" value={inv.due_date} />
              <Field label="Order" value={<Link to={`/orders/${inv.order_id}`} className="text-[#00A876] hover:underline">#{inv.order_id}</Link>} />
              <Field label="Region" value={inv.region_code} />
              {inv.payment_link && <Field label="Payment link" value={<a href={inv.payment_link} className="text-[#00A876] hover:underline break-all" target="_blank" rel="noreferrer">{inv.payment_link}</a>} />}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Payments */}
            <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <CreditCard size={16} className="text-gray-500" /> Payments
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{payments.length}</span>
                </h2>
                <Button size="sm" onClick={() => setPayOpen(true)}><Plus size={14} /> Add payment</Button>
              </div>
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No payments.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 text-[13px]">
                      <div>
                        <span className="font-medium text-gray-800">{money(p.sum)}</span>
                        {p.reference && <span className="ml-2 text-gray-400">{p.reference}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{p.date ?? '—'} · {p.source ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Reminder history */}
            <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Bell size={16} className="text-gray-500" /> Reminder history
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{reminders.length}</span>
              </h2>
              {reminders.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No reminders.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {reminders.map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 text-[13px]">
                      <span className="text-gray-700">Workflow #{r.workflow_id ?? '—'} · template {r.template_id ?? '—'}</span>
                      <span className="text-xs text-gray-400">{r.created_at?.slice(0, 19).replace('T', ' ') ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}

      {inv && (
        <>
          <Dialog open={dueOpen} onOpenChange={(o) => !busy && setDueOpen(o)}>
            <DialogContent className="max-w-md" onClose={() => setDueOpen(false)}>
              <DialogHeader>
                <DialogTitle>Change due date</DialogTitle>
                <DialogDescription>Update the due date for invoice #{inv.invoice_id}.</DialogDescription>
              </DialogHeader>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDueOpen(false)}>Cancel</Button>
                <Button disabled={!dueDate || busy} onClick={async () => { await run(() => updateInvoiceDueDate(invoiceId, dueDate)); setDueOpen(false) }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PaymentAddDialog open={payOpen} onOpenChange={setPayOpen} invoiceId={invoiceId} onAdded={refetch} />
        </>
      )}
    </div>
  )
}
