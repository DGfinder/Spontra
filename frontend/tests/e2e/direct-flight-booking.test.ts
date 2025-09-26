import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace
  }),
  useSearchParams: () => new URLSearchParams()
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.open
global.window.open = vi.fn()

describe('Direct Flight Booking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful flight search response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: [
          {
            id: 'flight-1',
            itineraryId: 'itin-1',
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            adults: 1,
            travelClass: 'ECONOMY',
            price: 299,
            currency: 'EUR',
            departureTime: '10:30',
            arrivalTime: '13:45',
            duration: '2h 15m',
            stops: 0,
            carrierCode: 'BA',
            flightNumber: 'BA123',
            aircraftType: 'A320',
            arrivalContext: 'afternoon arrival',
            confidence: 95,
            priceBreakdown: {
              baseFare: 200,
              taxes: 79,
              fees: 20
            },
            deeplinkContext: {
              itineraryId: 'itin-1',
              origin: 'LHR',
              destination: 'BCN',
              departureDate: '2025-09-27',
              adults: 1,
              cabinClass: 'ECONOMY',
              carrierCode: 'BA',
              flightNumber: 'BA123',
              stops: 0,
              price: 299,
              currency: 'EUR'
            }
          }
        ]
      })
    })
  })

  describe('Direct Flight Search Flow', () => {
    it('should allow direct flight search with query parameters', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      // Mock search params for direct flight search
      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            passengers: '1'
          })
        }
      })

      render(<DirectFlightSearchPage />)

      // Should show flight search results
      await waitFor(() => {
        expect(screen.getByText('Flight Search Results')).toBeInTheDocument()
        expect(screen.getByText('LHR → BCN • 2025-09-27')).toBeInTheDocument()
      })

      // Should show flight options
      await waitFor(() => {
        expect(screen.getByText('EUR299')).toBeInTheDocument()
        expect(screen.getByText('10:30 → 13:45')).toBeInTheDocument()
        expect(screen.getByText('BA BA123 • 2h 15m • Direct')).toBeInTheDocument()
      })
    })

    it('should show search form when no search parameters provided', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      // Mock empty search params
      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams()
        }
      })

      render(<DirectFlightSearchPage />)

      expect(screen.getByText('Direct Flight Search')).toBeInTheDocument()
      expect(screen.getByText('Search for flights directly without selecting a destination theme')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Origin airport (e.g., LHR)')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Destination airport (e.g., BCN)')).toBeInTheDocument()
    })

    it('should update URL when user types in search form', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      render(<DirectFlightSearchPage />)

      const originInput = screen.getByPlaceholderText('Origin airport (e.g., LHR)')
      fireEvent.change(originInput, { target: { value: 'lhr' } })

      // Should update URL with uppercase airport code
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('origin=LHR'),
          { scroll: false }
        )
      })
    })

    it('should validate airport codes in search form', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      render(<DirectFlightSearchPage />)

      const originInput = screen.getByPlaceholderText('Origin airport (e.g., LHR)')
      
      // Try invalid characters
      fireEvent.change(originInput, { target: { value: 'L1H2R3' } })

      // Should filter out non-alphabetic characters
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('origin=LHR'),
          { scroll: false }
        )
      })
    })
  })

  describe('Flight Booking Flow', () => {
    it('should create airline direct booking redirect', async () => {
      // Mock successful redirect API response
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            data: [/* flight data */]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            provider: 'airline-BA',
            url: 'https://www.britishairways.com/travel/fx/public/en_gb?from=LHR&to=BCN'
          })
        })

      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            passengers: '1'
          })
        }
      })

      render(<DirectFlightSearchPage />)

      // Wait for flights to load
      await waitFor(() => {
        expect(screen.getByText('Book Direct')).toBeInTheDocument()
      })

      // Click "Book Direct" button
      const bookDirectButton = screen.getByText('Book Direct')
      fireEvent.click(bookDirectButton)

      // Should call redirect API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/redirect/flight',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"carrierCode":"BA"')
          })
        )
      })

      // Should open new window with booking URL
      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith(
          'https://www.britishairways.com/travel/fx/public/en_gb?from=LHR&to=BCN',
          '_blank',
          'noopener,noreferrer'
        )
      })
    })

    it('should handle booking redirect failures gracefully', async () => {
      // Mock flight search success but redirect failure
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            data: [/* flight data */]
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({
            ok: false,
            error: 'Redirect service unavailable'
          })
        })

      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            passengers: '1'
          })
        }
      })

      render(<DirectFlightSearchPage />)

      await waitFor(() => {
        expect(screen.getByText('Book Direct')).toBeInTheDocument()
      })

      const bookDirectButton = screen.getByText('Book Direct')
      fireEvent.click(bookDirectButton)

      // Should show fallback URL after error
      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith(
          'https://www.kayak.com/flights/LHR-BCN/2025-09-27',
          '_blank',
          'noopener,noreferrer'
        )
      })

      // Should show error message briefly
      await waitFor(() => {
        expect(screen.getByText('Redirect failed, trying fallback')).toBeInTheDocument()
      })
    })

    it('should show loading states during booking redirect', async () => {
      // Mock delayed redirect response
      let resolveRedirect: (value: any) => void
      const redirectPromise = new Promise(resolve => {
        resolveRedirect = resolve
      })

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            data: [/* flight data */]
          })
        })
        .mockReturnValueOnce({
          ok: true,
          json: () => redirectPromise
        })

      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            passengers: '1'
          })
        }
      })

      render(<DirectFlightSearchPage />)

      await waitFor(() => {
        expect(screen.getByText('Book Direct')).toBeInTheDocument()
      })

      const bookDirectButton = screen.getByText('Book Direct')
      fireEvent.click(bookDirectButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Redirecting...')).toBeInTheDocument()
      })

      // Button should be disabled during loading
      expect(bookDirectButton).toBeDisabled()

      // Resolve the promise
      resolveRedirect!({
        ok: true,
        provider: 'airline-BA',
        url: 'https://www.britishairways.com/test'
      })

      // Should clear loading state
      await waitFor(() => {
        expect(screen.queryByText('Redirecting...')).not.toBeInTheDocument()
        expect(bookDirectButton).not.toBeDisabled()
      })
    })
  })

  describe('URL Parameter Handling', () => {
    it('should support all expected URL parameters', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            returnDate: '2025-10-04',
            passengers: '2',
            mode: 'flights'
          })
        }
      })

      render(<DirectFlightSearchPage />)

      await waitFor(() => {
        expect(screen.getByText('LHR → BCN • 2025-09-27 → 2025-10-04')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // Passengers count
      })

      // Should pass correct parameters to API
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/amadeus/flights',
        expect.objectContaining({
          body: expect.stringContaining('"returnDate":"2025-10-04"')
        })
      )
    })

    it('should handle one-way flights correctly', async () => {
      const DirectFlightSearchPage = (await import('@/app/flights/page')).default

      vi.mock('next/navigation', async () => {
        const actual = await vi.importActual('next/navigation')
        return {
          ...actual,
          useSearchParams: () => new URLSearchParams({
            origin: 'LHR',
            destination: 'BCN',
            departureDate: '2025-09-27',
            passengers: '1'
            // No returnDate = one-way
          })
        }
      })

      render(<DirectFlightSearchPage />)

      await waitFor(() => {
        expect(screen.getByText('LHR → BCN • 2025-09-27')).toBeInTheDocument()
        expect(screen.queryByText('→ 2025')).not.toBeInTheDocument() // No return date
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/amadeus/flights',
        expect.objectContaining({
          body: expect.not.stringContaining('"returnDate"')
        })
      )
    })
  })
})