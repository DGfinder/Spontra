'use client'

import { useSearchStore } from '@/lib/store'
import { SearchForm } from './SearchForm'
import { SearchResults } from './SearchResults'

export function SearchPage() {
  const { currentStep } = useSearchStore()

  return (
    <div className="min-h-screen">
      {currentStep === 'search' && <SearchForm />}
      {currentStep === 'results' && <SearchResults />}
    </div>
  )
}