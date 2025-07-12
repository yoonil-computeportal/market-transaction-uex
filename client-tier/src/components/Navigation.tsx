import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ShoppingCartIcon 
} from '@heroicons/react/24/outline'

export const Navigation: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { name: 'Marketplace', href: '/', icon: HomeIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
    { name: 'Transactions', href: '/transactions', icon: DocumentTextIcon },
    { name: 'Compare', href: '/compare', icon: ChartBarIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">
              ComputePortal Marketplace
            </h1>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
} 