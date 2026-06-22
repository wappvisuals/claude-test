import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Mail, RefreshCw, Pencil, Trash2, Ban, User, Undo2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useOrder } from '@/hooks/useOrder'
import { deleteOrderAdjustment, resendOrderConfirmation, setOrderReturn, getErrorMessage } from '@/lib/api'
import { OrderCancelDialog } from './OrderCancelDialog'
import { OrderAdjustmentDialog } from './OrderAdjustmentDialog'
import { OrderRefundDialog } from './OrderRefundDialog'
import { OrderNotesPanel } from './OrderNotesPanel'
import { InvoicesPanel } from '@/components/invoices/InvoicesPanel'
import type { OrderAdjustment, OrderLineItem } from '@/types/order'

const fmtDate = (v: string | null) => (v ? v.slice(0, 19).replace('T', ' ') : null)
const money = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Detail({ label, value, empty }: { label: string; value: React.ReactNode; empty?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5 text-[13px] text-[#1A1A2E] break-words">
        {empty ? <span className="italic text-gray-300">empty</span> : (value ?? <span className="text-gray-300">—</span>)}
      </div>
    </div>
  )
}

export function OrderViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderId = Number(id)
  const { order: o, loading, error, refetch } = useOrder(orderId)

  const [tab, setTab] = useState<'order' | 'logs'>('order')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<{ line: OrderLineItem; adjustment: OrderAdjustment | null } | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [toDeleteAdj, setToDeleteAdj] = useState<OrderAdjustment | null>(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [resendOpen, setResendOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const lineItems = o?.line_items ?? []
  const adjustments = o?.adjustments ?? []
  const adjustedTotal = o?.adjusted_total ?? o?.total ?? 0
  const totalChanged = o != null && Math.abs(adjustedTotal - o.total) > 0.001

  const adjustmentsFor = (item: OrderLineItem, idx: number): OrderAdjustment[] => {
    const key = item.rowid ?? `idx-${idx}`
    return adjustments.filter(a =>
      (a.rowid && a.rowid === item.rowid) ||
      (!a.rowid && a.prod_id != null && String(a.prod_id) === String(item.prod_id)) ||
      a.rowid === key
    )
  }

  function openAdjust(item: OrderLineItem, adjustment: OrderAdjustment | null) {
    setActionError(null)
    setAdjustTarget({ line: item, adjustment })
    setAdjustOpen(true)
  }

  async function handleDeleteAdj() {
    if (!toDeleteAdj) return
    try {
      await deleteOrderAdjustment(orderId, toDeleteAdj.id)
      refetch()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-[#00C48C]">
        <ArrowLeft size={16} /> Back
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : o ? (
        <div className="rounded-xl border border-[#EBEBF5] bg-white">
          {/* Header: tabs + actions */}
          <div className="flex items-center justify-between gap-4 border-b border-[#F0F1F7] px-5 pt-4">
            <div className="flex gap-5">
              <button
                onClick={() => setTab('order')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${tab === 'order' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                {o.is_cancelled ? 'Cancelled Order' : 'Approved Order'}
              </button>
              <button
                onClick={() => setTab('logs')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${tab === 'logs' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                Logs
              </button>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button onClick={() => setResendOpen(true)} className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100" title="Resend confirmation email">
                <Mail size={15} />
              </button>
              <button onClick={refetch} className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100" title="Refresh">
                <RefreshCw size={15} />
              </button>
              <Button variant="outline" size="sm" onClick={() => setReturnOpen(true)}>
                {o.returned ? <><Undo2 size={14} /> Returned</> : <><RotateCcw size={14} /> Mark returned</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>Refund</Button>
              {!o.is_cancelled && (
                <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
                  <Ban size={14} /> Cancel
                </Button>
              )}
            </div>
          </div>

          {tab === 'logs' ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">No logs available.</p>
          ) : (
            <>
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-4">
                <Detail label="Order No." value={o.id} />
                <Detail label="Shipping date" value={fmtDate(o.date_shipped)} />
                <Detail label="IP No." value={o.ip} />
                <Detail
                  label="Total Amount"
                  value={totalChanged
                    ? <span className="flex items-center gap-1.5"><span className="text-gray-400 line-through">{money(o.total)}</span><span className="font-medium">{money(adjustedTotal)}</span></span>
                    : money(o.total)}
                />

                <Detail label="Invoice No." value={o.invoice_no} />
                <Detail label="Date Paid" value={o.date_paid ? fmtDate(o.date_paid) : <span className="text-gray-400">Not paid yet</span>} />
                <Detail label="Reference" value={o.ref} empty={!o.ref} />
                <Detail label="Parcel Tracking ID" value={o.parcel_tracking_id} empty={!o.parcel_tracking_id} />

                <Detail
                  label="Invoice Partner"
                  value={
                    <span className="flex items-center gap-1.5">
                      {o.invoice_partner ?? '—'}
                      {o.gothia_account != null && (
                        <span className="rounded bg-[#EEF1F7] px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{o.gothia_account}</span>
                      )}
                    </span>
                  }
                />
                <Detail label="Shipped" value={o.is_shipped ? 'Yes' : 'No'} />
                <Detail label="Reference #1" value={o.ref1} empty={!o.ref1} />
                <div />

                <Detail label="Date Added" value={fmtDate(o.date_added)} />
                <Detail label="Paid by Customer" value={o.is_paid ? 'Yes' : 'No'} />
                <Detail label="Reference #2" value={o.ref2} empty={!o.ref2} />
                <Detail
                  label="Customer"
                  value={o.customer
                    ? <Link to={`/customers/${o.customer.to_user}`} className="text-[#00A876] hover:underline">{o.customer.first_name} {o.customer.last_name}</Link>
                    : o.by_user}
                />
              </div>

              {/* Line items + per-line adjustments */}
              <div className="border-t border-[#F0F1F7]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFBFF] text-[11px] uppercase tracking-wide text-gray-400">
                      <th className="px-5 py-3 text-left font-medium">Product ID</th>
                      <th className="px-2 py-3 text-left font-medium">Product Name</th>
                      <th className="px-2 py-3 text-left font-medium">Qty</th>
                      <th className="px-5 py-3 text-left font-medium">Price</th>
                    </tr>
                  </thead>
                  {lineItems.length === 0 ? (
                    <tbody>
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No line items.</td></tr>
                    </tbody>
                  ) : (
                    lineItems.map((item, idx) => {
                      const key = item.rowid ?? `idx-${idx}`
                      const adj = adjustmentsFor(item, idx)[0] ?? null
                      return (
                          <tbody key={key}>
                            <tr className="border-t border-[#F0F1F7]">
                              <td className="px-5 py-3.5">
                                <span className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center rounded-full border border-[#EBEBF5] bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                                    {o.region_code ?? '—'}
                                  </span>
                                  <span className="text-[13px] font-medium text-[#00A876]">{item.prod_id ?? '—'}</span>
                                </span>
                              </td>
                              <td className="px-2 py-3.5 text-[13px] text-[#1A1A2E]">{item.name ?? '—'}</td>
                              <td className="px-2 py-3.5 text-[13px] text-[#1A1A2E]">{item.qty ?? '—'}</td>
                              <td className="px-5 py-3.5 text-[13px] text-[#1A1A2E]">
                                {adj && adj.new_price !== null
                                  ? <span className="flex items-center gap-1.5"><span className="text-gray-400 line-through">{item.price ?? '—'}</span><span className="font-medium">{adj.new_price}</span></span>
                                  : (item.price ?? '—')}
                              </td>
                            </tr>

                            {/* Adjustment sub-row */}
                            <tr className="border-b border-dashed border-[#EBEBF5]">
                              <td colSpan={4} className="px-5 py-3">
                                <div className="flex items-center justify-between gap-4">
                                  {adj ? (
                                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                                      <span className="size-1.5 rounded-full bg-gray-300" />
                                      <span className="text-gray-700">Price adjusted from {adj.old_price} to {adj.new_price}</span>
                                      {adj.comment && <span className="italic text-gray-400">{adj.comment}</span>}
                                      <span className="flex items-center gap-1 text-gray-500">
                                        <User size={13} /> {adj.initiator_name ?? 'System'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[13px] text-gray-400">No Adjustment</span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {adj?.created_at && <span className="text-[12px] text-gray-300">{adj.created_at.slice(0, 19).replace('T', ' ')}</span>}
                                    <button onClick={() => openAdjust(item, adj)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#00A876]" title={adj ? 'Edit adjustment' : 'Adjust price'}>
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      onClick={() => adj && (setActionError(null), setToDeleteAdj(adj))}
                                      disabled={!adj}
                                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                      title="Delete adjustment"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                      )
                    })
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      ) : null}

      {o && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InvoicesPanel orderId={orderId} />
          <OrderNotesPanel order={o} onChanged={refetch} />
        </div>
      )}

      {o && (
        <>
          <OrderCancelDialog open={cancelOpen} onOpenChange={setCancelOpen} orderId={orderId} onCancelled={refetch} />
          <OrderRefundDialog open={refundOpen} onOpenChange={setRefundOpen} orderId={orderId} total={o.total} lineItems={lineItems} onRefunded={refetch} />
          <ConfirmDialog
            open={resendOpen}
            onOpenChange={setResendOpen}
            title="Resend confirmation email?"
            description="The order confirmation will be re-sent to the customer."
            confirmLabel="Resend"
            onConfirm={async () => { await resendOrderConfirmation(orderId); refetch() }}
          />
          <ConfirmDialog
            open={returnOpen}
            onOpenChange={setReturnOpen}
            title={o.returned ? 'Unmark as returned?' : 'Mark order as returned?'}
            description={o.returned ? 'This clears the returned state on the order.' : 'This flags the order as returned.'}
            confirmLabel={o.returned ? 'Unmark' : 'Mark returned'}
            onConfirm={async () => { await setOrderReturn(orderId, o.returned ? 'unset' : 'set', 'manual'); refetch() }}
          />
          <OrderAdjustmentDialog
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            orderId={orderId}
            line={adjustTarget ? {
              rowid: adjustTarget.line.rowid,
              prod_id: adjustTarget.line.prod_id,
              name: adjustTarget.line.name,
              price: Number(adjustTarget.line.price) || 0,
            } : null}
            adjustment={adjustTarget?.adjustment ?? null}
            onSaved={refetch}
          />
          <ConfirmDialog
            open={toDeleteAdj !== null}
            onOpenChange={(o) => !o && setToDeleteAdj(null)}
            title="Delete adjustment?"
            description="This removes the adjustment from the order."
            confirmLabel="Delete"
            destructive
            onConfirm={handleDeleteAdj}
          />
        </>
      )}
    </div>
  )
}
