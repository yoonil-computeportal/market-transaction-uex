import React from 'react'
import { Resource } from '../types'
import { 
  CpuChipIcon, 
  ServerIcon, 
  DeviceTabletIcon, 
  WifiIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ResourceCardProps {
  resource: Resource
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'CPU':
      return <CpuChipIcon className="h-6 w-6" />
    case 'GPU':
      return <ServerIcon className="h-6 w-6" />
    case 'Storage':
      return <DeviceTabletIcon className="h-6 w-6" />
    case 'Network':
      return <WifiIcon className="h-6 w-6" />
    default:
      return <ServerIcon className="h-6 w-6" />
  }
}

const getSlaColor = (sla: string) => {
  switch (sla) {
    case 'Platinum':
      return 'bg-purple-100 text-purple-800'
    case 'Gold':
      return 'bg-yellow-100 text-yellow-800'
    case 'Silver':
      return 'bg-gray-100 text-gray-800'
    case 'Bronze':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-primary-600">
            {getResourceIcon(resource.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{resource.name}</h3>
            <p className="text-sm text-gray-600">{resource.type}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSlaColor(resource.sla)}`}>
          {resource.sla}
        </span>
      </div>

      {/* Specifications */}
      <div className="space-y-2 mb-4">
        {resource.specifications.cpu && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CPU:</span>
            <span className="font-medium">{resource.specifications.cpu} cores</span>
          </div>
        )}
        {resource.specifications.memory && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Memory:</span>
            <span className="font-medium">{resource.specifications.memory} GB</span>
          </div>
        )}
        {resource.specifications.storage && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Storage:</span>
            <span className="font-medium">{resource.specifications.storage} GB</span>
          </div>
        )}
        {resource.specifications.gpu && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GPU:</span>
            <span className="font-medium">{resource.specifications.gpu}</span>
          </div>
        )}
      </div>

      {/* Location and Provider */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <MapPinIcon className="h-4 w-4" />
          <span>{resource.location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4" />
          <span>{resource.estimatedProvisioningTime} min</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex items-center space-x-1">
          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{resource.rating}</span>
        </div>
        <span className="text-sm text-gray-600">({resource.reviews} reviews)</span>
      </div>

      {/* Availability and Price */}
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-600">Availability: </span>
          <span className={`font-medium ${resource.availability > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {resource.availability > 0 ? `${resource.availability} available` : 'Out of stock'}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            ${resource.price.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600">per hour</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        className="w-full btn-primary mt-4"
        disabled={resource.availability === 0}
      >
        {resource.availability > 0 ? 'Order Now' : 'Out of Stock'}
      </button>
    </div>
  )
} 