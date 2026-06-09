import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Pencil, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionEditDialog } from './SubscriptionEditDialog'
import { SubscriptionDeactivateDialog } from './SubscriptionDeactivateDialog'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-[14px] text-[#1A1A2E]">{value ?? '—'}</span>
    </div>
  )
}

export function SubscriptionViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const subId = Number(id)
  const { subscription: s, loading, error, refetch } = useSubscription(subId)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5 p-6">
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-[#00C48C]">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <RefreshCw size={22} className="text-gray-700" />
          Subscription #{subId}
        </h1>
        {s && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> Edit shipment
            </Button>
            {s.active ? (
              <Button variant="destructive" size="sm" onClick={() => setDeactivateOpen(true)}>
                <Ban size={14} /> Deactivate
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : s ? (
        <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${s.active ? 'bg-[#E8FBF5] text-[#00A876]' : 'bg-[#FDECEC] text-[#E5484D]'}`}>
              {s.status}
            </span>
            <span className="text-sm text-gray-500">{s.product_name ?? `Product #${s.prod_id}`}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
            <Field label="Payment type" value={s.payment_type} />
            <Field label="Next shipment" value={s.next_shipment} />
            <Field label="Pre-finance count" value={s.pre_finance_count} />
            <Field label="Pre-financed" value={s.is_pre_financed ? 'Yes' : 'No'} />
            <Field label="Commitment" value={`${s.commitment ?? '—'}`} />
            <Field label="Prod ID" value={s.prod_id} />
            <Field label="Date started" value={s.date_started} />
            <Field label="Date cancelled" value={s.date_cancelled} />
            <Field label="Date churned" value={s.date_churned} />
            <Field label="Date inactivated" value={s.date_inactivated} />
            <Field label="Cancel method" value={s.cancel_method} />
            <Field label="Cancel reason" value={s.cancel_reason} />
            <Field label="Reference" value={s.reference} />
            <Field label="Final invoice" value={s.final_invoice} />
          </div>
        </div>
      ) : null}

      {s && (
        <>
          <SubscriptionEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            subscriptionId={subId}
            currentNextShipment={s.next_shipment}
            onSaved={refetch}
          />
          <SubscriptionDeactivateDialog
            open={deactivateOpen}
            onOpenChange={setDeactivateOpen}
            subscriptionId={subId}
            onDeactivated={refetch}
          />
        </>
      )}
    </div>
  )
}
