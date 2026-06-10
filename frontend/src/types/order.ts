import type { PaginatedResponse } from './customer'

export interface OrderAdjustment {
  id: number
  order_id: number
  type: string
  adj_total: number | null
  old_price: number | null
  new_price: number | null
  rowid: string | null
  prod_id: number | string | null
  product_name: string | null
  comment: string | null
  origin: string | null
  initiator: number | null
  initiator_name: string | null
  created_at: string | null
}

export interface OrderLineItem {
  rowid: string | null
  prod_id: number | string | null
  name: string | null
  qty: number | string | null
  price: number | string | null
  vat_percent: number | string | null
  subtotal: number | string | null
}

export interface Order {
  id: number
  by_user: number
  customer?: { to_user: number; first_name: string; last_name: string }
  prod_id: number
  product_name: string | null
  subscription_id: number | null
  date_added: string | null
  date_shipped: string | null
  date_paid: string | null
  total: number
  adjusted_total?: number
  total_vat: number
  vat_rate: string | null
  payment_method: string | null
  is_processed: boolean
  is_shipped: boolean
  is_paid: boolean
  is_cancelled: boolean
  ref: string | null
  ref1: string | null
  ref2: string | null
  region_code: string | null
  ip: string | null
  invoice_no: string | null
  gothia_account: number | null
  invoice_partner: string | null
  shipment_center: string | null
  partner: string | null
  parcel_tracking_id: string | null
  reason: string | null
  metadata: Record<string, unknown> | null
  line_items?: OrderLineItem[]
  adjustments?: OrderAdjustment[]
}

export type OrderList = PaginatedResponse<Order>

// ─── Grouped per-customer list (groups by product, like the legacy profile) ────

export interface OrderGroupItem {
  id: number
  prod_id: number
  product_name: string | null
  subscription_id: number | null
  date_added: string | null
  total: number
  is_shipped: boolean
  is_paid: boolean
  is_cancelled: boolean
  ref: string | null
  ref1: string | null
  region_code: string | null
  reason: string | null
}

export interface OrderGroup {
  group_key: string
  label: string | null
  brand: string | null
  items: OrderGroupItem[]
}

export interface OrderGroupList {
  data: OrderGroup[]
  meta: { total: number; per_page: number; returned: number; group_count: number }
}

export interface CustomerOrderParams {
  status?: 'approved' | 'cancelled' | 'all'
  brand?: string
  sort_dir?: 'asc' | 'desc'
  per_page?: number
}
