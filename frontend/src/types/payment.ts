export interface Payment {
  id: number
  invoice_id: number | null
  sum: number
  date: string | null
  reference: string | null
  payer_name: string | null
  source: string | null
  is_processed: boolean
  created_at: string | null
}

export type PaymentList = { data: Payment[] }
