export interface EventLogEntry {
  id: number
  type: string | null
  ref: string | null
  data: string | null
  prod_id: number | null
  sub_id: number | null
  company_type: string | null
  initiator: number | null
  date: string | null
}

export type EventLogList = { data: EventLogEntry[] }
