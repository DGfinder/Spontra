'use client'

import { CountryGrid } from './CountryGrid'
import { CountryGroup } from '@/types/country'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface CountryGridWrapperProps {
  countries: CountryGroup[]
  theme: string
}

export function CountryGridWrapper({ countries, theme }: CountryGridWrapperProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleExplore = (countryCode: string) => {
    router.push(`/explore/${countryCode.toLowerCase()}`)
  }

  return (
    <div
      className={`transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CountryGrid
        countries={countries}
        theme={theme}
        onExplore={handleExplore}
      />
    </div>
  )
}
