import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { resourceApi } from '../services/api'
import { Resource, SearchParams, SearchFilters } from '../types'
import { ResourceCard } from '../components/ResourceCard'
import { SearchFilters as SearchFiltersComponent } from '../components/SearchFilters'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline'

export const Marketplace: React.FC = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    filters: {},
    sortBy: 'price',
    sortOrder: 'asc',
    page: 1,
    limit: 12
  })

  const [showFilters, setShowFilters] = useState(false)

  const { data: resourcesData, isLoading, error, refetch } = useQuery(
    ['resources', searchParams],
    () => resourceApi.search(searchParams),
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
      staleTime: 10000,
    }
  )

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }))
  }

  const handleFiltersChange = (filters: SearchFilters) => {
    setSearchParams(prev => ({ ...prev, filters, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams(prev => ({ ...prev, sortBy: sortBy as any, sortOrder }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compute Resources Marketplace</h1>
          <p className="text-gray-600 mt-2">
            Discover and purchase compute resources from providers worldwide
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 btn-secondary"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for compute resources..."
          className="input-field pl-10"
          value={searchParams.query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <SearchFiltersComponent
            filters={searchParams.filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      )}

      {/* Sort Options */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc')
            }}
            className="input-field w-auto"
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="availability-asc">Availability: Low to High</option>
            <option value="availability-desc">Availability: High to Low</option>
            <option value="rating-desc">Rating: High to Low</option>
          </select>
        </div>
        
        {resourcesData && (
          <div className="text-sm text-gray-600">
            {resourcesData.pagination.total} resources found
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-800">
            Error loading resources. Please try again.
          </div>
        </div>
      )}

      {/* Resources Grid */}
      {resourcesData && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resourcesData.data.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {/* Pagination */}
          {resourcesData.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(searchParams.page - 1)}
                disabled={searchParams.page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {searchParams.page} of {resourcesData.pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(searchParams.page + 1)}
                disabled={searchParams.page === resourcesData.pagination.totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {resourcesData && resourcesData.data.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <AdjustmentsHorizontalIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find more resources.
          </p>
        </div>
      )}
    </div>
  )
} 