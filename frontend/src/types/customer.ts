export type CustomerStatus = 'active' | 'inactive' | 'blocked'

export type MatchedField = 'name' | 'email' | 'phone' | 'address' | 'ssn'

export interface Customer {
  // Core identity
  id: number
  full_name: string
  first_name: string
  last_name: string

  // Contact
  email: string | null
  alternative_email: string | null
  tel: string | null
  alternative_tel: string | null

  // Status & flags
  status: CustomerStatus
  do_not_call: boolean | null
  difficult_customer: boolean | null
  want_newsletter: boolean | null

  // Address
  careof: string | null
  adress: string | null
  post_nr: string | null
  ort: string | null

  // Identity / profile
  pers_nr: string | null
  sex: string | null
  birthdate: string | null
  language: string | null
  region_code: string | null

  // Dates
  date_added: string | null       // YYYY-MM-DD
  first_visit: string | null
  updated_at: string | null
  last_order: string | null       // YYYY-MM-DD, computed from orders table; null if no orders

  // Organisation
  organization_id: number | null

  // JSON fields (detail page)
  comments: string | null
  ledgers: unknown[] | null
  blocked_fees: unknown[] | null
  reminders: unknown | null
  gothia_account: unknown | null

  // Misc
  credit_check: string | null
  sync: string | null

  // Search-only — null on list endpoint
  relevance_score: number | null
  matched_fields: MatchedField[] | null
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface CustomerListParams {
  page?: number
  per_page?: number
  sort_by?: 'to_user' | 'first_name' | 'last_name' | 'last_order'
  sort_dir?: 'asc' | 'desc'
  status?: CustomerStatus[]
}

export interface CustomerSearchParams {
  q: string
  status?: CustomerStatus[]
  last_order_after?: string
  last_order_before?: string
  page?: number
  per_page?: number
}
