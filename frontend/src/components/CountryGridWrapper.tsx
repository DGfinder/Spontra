'use client'

import { CountryGrid } from './CountryGrid'
import { CountryGroup } from '@/types/country'
import { useRouter } from 'next/navigation'

interface CountryGridWrapperProps {
  countries: CountryGroup[]
  theme: string
}

export function CountryGridWrapper({ countries, theme }: CountryGridWrapperProps) {
  const router = useRouter()

  const handleExplore = (countryCode: string) => {
    router.push(`/explore/${countryCode.toLowerCase()}`)
  }

  return (
    <CountryGrid
      countries={countries}
      theme={theme}
      onExplore={handleExplore}
    />
  )
}
