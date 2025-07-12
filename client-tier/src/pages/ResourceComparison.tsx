import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { resourceApi } from '../services/api'
import { Resource } from '../types'

export const ResourceComparison: React.FC = () => {
  const [selectedResources, setSelectedResources] = useState<string[]>([])

  const { data: resources, isLoading } = useQuery(
    ['resources', 'all'],
    () => resourceApi.search({ page: 1, limit: 100, filters: {} }),
    {
      enabled: false
    }
  )

  const { data: comparisonData } = useQuery(
    ['resources', 'compare', selectedResources],
    () => resourceApi.compare(selectedResources),
    {
      enabled: selectedResources.length > 0
    }
  )

  const handleResourceSelect = (resourceId: string) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(prev => prev.filter(id => id !== resourceId))
    } else if (selectedResources.length < 5) {
      setSelectedResources(prev => [...prev, resourceId])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Resource Comparison</h1>
        <p className="text-gray-600 mt-2">
          Compare up to 5 resources side-by-side
        </p>
      </div>

      {/* Resource Selection */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Resources to Compare</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources?.data.map((resource: Resource) => (
            <label key={resource.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedResources.includes(resource.id)}
                onChange={() => handleResourceSelect(resource.id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-900">{resource.name}</div>
                <div className="text-sm text-gray-600">${resource.price}/hour</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {comparisonData && comparisonData.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Comparison Results</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specification
                </th>
                {comparisonData.map((resource: Resource) => (
                  <th key={resource.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {resource.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Type</td>
                {comparisonData.map((resource: Resource) => (
                  <td key={resource.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resource.type}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price</td>
                {comparisonData.map((resource: Resource) => (
                  <td key={resource.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${resource.price}/hour
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SLA</td>
                {comparisonData.map((resource: Resource) => (
                  <td key={resource.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resource.sla}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Location</td>
                {comparisonData.map((resource: Resource) => (
                  <td key={resource.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resource.location}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rating</td>
                {comparisonData.map((resource: Resource) => (
                  <td key={resource.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resource.rating}/5 ({resource.reviews} reviews)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 