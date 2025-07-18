import Image from 'next/image'
import Link from 'next/link'

const popularDestinations = [
  {
    city: 'New York',
    country: 'United States',
    price: 'from $299',
    image: '/images/destinations/new-york.jpg',
    airport: 'JFK'
  },
  {
    city: 'London',
    country: 'United Kingdom',
    price: 'from $459',
    image: '/images/destinations/london.jpg',
    airport: 'LHR'
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    price: 'from $689',
    image: '/images/destinations/tokyo.jpg',
    airport: 'NRT'
  },
  {
    city: 'Paris',
    country: 'France',
    price: 'from $399',
    image: '/images/destinations/paris.jpg',
    airport: 'CDG'
  },
  {
    city: 'Dubai',
    country: 'UAE',
    price: 'from $549',
    image: '/images/destinations/dubai.jpg',
    airport: 'DXB'
  },
  {
    city: 'Sydney',
    country: 'Australia',
    price: 'from $899',
    image: '/images/destinations/sydney.jpg',
    airport: 'SYD'
  }
]

export function PopularDestinations() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Popular Destinations
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing places around the world with great flight deals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDestinations.map((destination, index) => (
            <Link
              key={index}
              href={`/flights?destination=${destination.airport}`}
              className="group block"
            >
              <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="relative h-48 bg-gray-200 mb-4">
                  {/* Placeholder for destination image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium">{destination.city}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {destination.city}
                  </h3>
                  <p className="text-gray-600 mb-2">{destination.country}</p>
                  <p className="text-primary-600 font-semibold">{destination.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/destinations" className="btn-secondary">
            View All Destinations
          </Link>
        </div>
      </div>
    </section>
  )
}