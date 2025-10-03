import { notFound } from 'next/navigation'
import { getDestinationWithPOIs } from '@/actions/destinationActions'
import { DestinationDetail } from '@/components/DestinationDetail'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; theme?: string }>
}

export default async function DestinationPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { from, theme } = await searchParams

  const result = await getDestinationWithPOIs(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <DestinationDetail
      destination={result.data}
      originAirport={from}
      selectedTheme={theme || 'adventure'}
    />
  )
}
