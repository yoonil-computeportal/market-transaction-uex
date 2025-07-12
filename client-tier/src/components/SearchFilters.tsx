import React, { useState } from 'react'
import { SearchFilters as SearchFiltersType } from '../types'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters)

  const resourceTypes = ['CPU', 'GPU', 'Storage', 'Network']
  const slaTiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
  const locations = ['US East', 'US West', 'Europe', 'Asia', 'Australia']

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newPriceRange = {
      ...localFilters.priceRange,
      [type]: value
    }
    handleFilterChange('priceRange', newPriceRange)
  }

  const handleArrayFilterChange = (key: keyof SearchFiltersType, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || []
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value)
    handleFilterChange(key, newArray)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFiltersType = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Clear all
        </button>
      </div>

      {/* Resource Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Resource Type</h4>
        <div className="space-y-2">
          {resourceTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={(localFilters.resourceType || []).includes(type)}
                onChange={(e) => handleArrayFilterChange('resourceType', type, e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range (per hour)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localFilters.priceRange?.min || ''}
              onChange={(e) => handlePriceRangeChange('min', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localFilters.priceRange?.max || ''}
              onChange={(e) => handlePriceRangeChange('max', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="1000.00"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Location</h4>
        <div className="space-y-2">
          {locations.map((location) => (
            <label key={location} className="flex items-center">
              <input
                type="checkbox"
                checked={(localFilters.location || []).includes(location)}
                onChange={(e) => handleArrayFilterChange('location', location, e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{location}</span>
            </label>
          ))}
        </div>
      </div>

      {/* SLA Tier */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">SLA Tier</h4>
        <div className="space-y-2">
          {slaTiers.map((sla) => (
            <label key={sla} className="flex items-center">
              <input
                type="checkbox"
                checked={(localFilters.sla || []).includes(sla)}
                onChange={(e) => handleArrayFilterChange('sla', sla, e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{sla}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localFilters.availability || false}
            onChange={(e) => handleFilterChange('availability', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Show only available resources</span>
        </label>
      </div>
    </div>
  )
} 