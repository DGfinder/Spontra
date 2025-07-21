import { ExploreForm } from '@/components/ExploreForm'
import { Header } from '@/components/Header'
import { PopularDestinations } from '@/components/PopularDestinations'

export default function HomePage() {
  return (
    <main>
      <Header isExploreMode={true} />
      
      {/* Explore Form with Dynamic Background - Full Screen */}
      <ExploreForm />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Spontra?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make spontaneous travel planning effortless by suggesting destinations that match your time and interests.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Time-Based Discovery</h3>
              <p className="text-gray-600">Find destinations within your preferred flight time for perfect weekend getaways.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Activity Matching</h3>
              <p className="text-gray-600">Get destination suggestions based on your interests - culture, food, nightlife, and more.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Spontaneous Adventures</h3>
              <p className="text-gray-600">Perfect for last-minute trips and discovering hidden gems within easy reach.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <PopularDestinations />
    </main>
  )
}