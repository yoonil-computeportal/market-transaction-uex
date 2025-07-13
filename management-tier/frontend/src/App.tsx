import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import FeeManagement from './pages/FeeManagement'
import Dashboard from './pages/Dashboard'
import PaymentWorkflow from './pages/PaymentWorkflow';
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fee-management" element={<FeeManagement />} />
            <Route path="/payment-workflow" element={<PaymentWorkflow />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App 