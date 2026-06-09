export interface CustomerStoreStats {
  subscriptions: { active: number; cancelled: number }
  orders: { approved: number; pending: number }
  last_order: string | null
}
