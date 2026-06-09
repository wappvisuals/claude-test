import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { CustomerListPage } from './components/customers/CustomerListPage'
import { CustomerDetailPage } from './components/customers/CustomerDetailPage'
import { BlockedSsnPage } from './components/blocked-ssn/BlockedSsnPage'
import { GdprListPage } from './components/gdpr/GdprListPage'
import { SinfridDashboardPage } from './components/sinfrid/SinfridDashboardPage'
import { CustomerCommentsPage } from './components/customers/CustomerCommentsPage'
import { CustomerChangeLogPage } from './components/customers/CustomerChangeLogPage'
import { OrderListPage } from './components/orders/OrderListPage'
import { OrderViewPage } from './components/orders/OrderViewPage'
import { SubscriptionViewPage } from './components/subscriptions/SubscriptionViewPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/comments" element={<CustomerCommentsPage />} />
          <Route path="/customers/:id/changes" element={<CustomerChangeLogPage />} />
          <Route path="/customers/:id/sinfrid" element={<SinfridDashboardPage />} />
          <Route path="/gdpr" element={<GdprListPage />} />
          <Route path="/blocked-ssn" element={<BlockedSsnPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:id" element={<OrderViewPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionViewPage />} />
          <Route index element={<Navigate to="/customers" replace />} />
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
