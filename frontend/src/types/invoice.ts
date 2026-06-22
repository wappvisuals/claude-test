import type { PaginatedResponse } from './customer'

export interface Invoice {
  id: number
  invoice_id: string | null
  order_id: number
  customer_id: string | null
  sub_account_id: string | null
  region_code: string | null
  provider: string | null
  owner: string | null
  total: number
  balance: number
  date: string | null
  due_date: string | null
  status: string | null
  payment_link: string | null
  customer?: { to_user: number; first_name: string; last_name: string } | null
  created_at: string | null
}

export interface InvoiceReminder {
  id: number
  workflow_id: number | null
  template_id: number | null
  batch: string | null
  status: number
  created_at: string | null
}

// Resource collections come back as { data: [...] } (no pagination for these lists).
export type InvoiceList = { data: Invoice[] }
export type InvoiceReminderList = { data: InvoiceReminder[] }
export type { PaginatedResponse }
