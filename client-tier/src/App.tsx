import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Marketplace } from './pages/Marketplace'
import { TransactionHistory } from './pages/TransactionHistory'
import { ResourceComparison } from './pages/ResourceComparison'
import { OrderManagement } from './pages/OrderManagement'
import { PaymentCenter } from './pages/PaymentCenter'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/compare" element={<ResourceComparison />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/payments" element={<PaymentCenter />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 