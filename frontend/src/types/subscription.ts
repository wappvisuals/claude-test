import type { PaginatedResponse } from './customer'

export interface Subscription {
  id: number
  user_id: number
  active: number
  status: string
  commitment: number | null
  i: number
  payment_type: string | null
  prod_id: number
  product_name: string | null
  next_shipment: string | null
  date_started: string | null
  date_cancelled: string | null
  date_churned: string | null
  date_inactivated: string | null
  days: number | null
  reference: string | null
  ref1: string | null
  ref2: string | null
  cancel_method: string | null
  cancel_reason: string | null
  is_pre_financed: boolean
  pre_finance_count: number
  final_invoice: string | null
  created_at: string | null
  updated_at: string | null
}

export type SubscriptionList = PaginatedResponse<Subscription>

// ─── Grouped per-customer list (groups by remote_id, like the legacy profile) ──

export interface SubscriptionGroupItem {
  id: number
  remote_id: number | null
  prod_id: number
  product_name: string | null
  brand: string | null
  active: number
  status: string
  order_count: number
  commitment: number
  next_shipment: string | null
  date_started: string | null
  date_cancelled: string | null
  date_churned: string | null
  date_inactivated: string | null
  days: number | null
  reference: string | null
  cancel_method: string | null
  cancel_reason: string | null
  is_pre_financed: boolean
  pre_finance_count: number
  sequence: number | null
}

export interface SubscriptionGroup {
  group_key: string
  is_group: boolean
  label: string | null
  brand: string | null
  items: SubscriptionGroupItem[]
}

export interface SubscriptionGroupList {
  data: SubscriptionGroup[]
  meta: { total: number; per_page: number; returned: number; group_count: number }
}

export interface CustomerSubscriptionParams {
  status?: 'all' | 'active' | 'cancelled'
  brand?: string
  sort_dir?: 'asc' | 'desc'
  per_page?: number
}
