import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { CustomerListPage } from './components/customers/CustomerListPage'
import { CustomerDetailPage } from './components/customers/CustomerDetailPage'
import { BlockedSsnPage } from './components/blocked-ssn/BlockedSsnPage'
import { GdprListPage } from './components/gdpr/GdprListPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/gdpr" element={<GdprListPage />} />
          <Route path="/blocked-ssn" element={<BlockedSsnPage />} />
          <Route index element={<Navigate to="/customers" replace />} />
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
