import type { PaginatedResponse } from './customer'

export interface SinfridMember {
  id: string
  account_id: string
  ssn: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  status: boolean
  is_deactivated: boolean
  last_login_at: string | null
  created_at: string | null
}

export interface SinfridAccount {
  id: string
  customer_id: number
  type: string | null
  plan_id: number | null
  plan_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  street: string | null
  zipcode: string | null
  lang_code: string | null
  country_code: string | null
  activation_date: string | null
  email_confirmed: boolean
  phone_confirmed: boolean
  status: boolean
  is_active: boolean
  is_deactivated: boolean
  last_login_at: string | null
  deactivated_at: string | null
  created_at: string | null
  family_members: SinfridMember[]
}

export interface SinfridAlarm {
  id: number
  text: string | null
  severity: string | null
  status: string | null
  category: string | null
  source: string | null
  coachme_available: boolean
  coachme_description: string | null
  date: string | null
  created_at: string | null
}

export interface SinfridActivity {
  event: string
  label: string
  date: string | null
}

export interface SinfridPlan {
  id: number
  plan: string
  label: string
  category: string | null
  max_members: number | null
}

export interface SinfridMemberPayload {
  ssn: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

export type SinfridAlarmList = PaginatedResponse<SinfridAlarm>
